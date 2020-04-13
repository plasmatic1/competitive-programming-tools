import * as vscode from 'vscode';
import * as pidusage from 'pidusage';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe, errorIfUndefined } from '../extUtils';
import { outputDI, testManager, log } from '../extension';
import { ChildProcess } from 'child_process';
import { EventType } from '../display/outputDisplayInterface';
import { CheckerFunction, getCheckerFunction, check } from './checker';

// tslint:disable: curly

/**
 * Gets current timestamp
 */
function getTime(): number {
    return new Date().getTime();
}

/**
 * Creates an exit message from the exit code and signal used to kill program
 * @param code Exit code of program
 * @param signal Signal that the program was killed by (or null if no signal was sent)
 */
function createExitStatus(code: number, signal: string): string {
    if (!isNull(signal))
        return 'Signal: ' + signal + (signal === 'SIGTERM' ? ' (timeout?)' : '');

    let extra = '';
    if (code > 255) extra = ' (segfault?)';
    else if (code === 3) extra = ' (assertion failed)';
    return 'Exit Code: ' + code.toString() + extra;
}

/**
 * Returns the source file from the current file open.  If no file is open, an error is thrown
 * @returns The source file name
 */
function getSourceFile(): string {
    let currEditor = errorIfUndefined(vscode.window.activeTextEditor, 'No open file!');
    return currEditor.document.uri.fsPath;
}

/**
 * Resolves the executor for that source file.  Throws an error if the executor was not found
 * @param src The source file path
 */
function getExecutor(src: string): Executor {
    const srcName = popUnsafe(src.split('\\')),
        ext = popUnsafe(srcName.split('.')), 
        executorConstructor = errorIfUndefined(executors.get(ext), `File extension ${ext} not supported for running!`);
    return new executorConstructor(src);
}

// Result Classes
// Note that executionId should always count up

export class Result {
    // These properties are set later on after initial construction
    stdout: string = ''; // Stdout data
    stderr: string = ''; // Stderr data
    verdict: string = 'Waiting'; // Verdict
    time: number = 0; // Time
    memory: number = 0;
    exitStatus: string = 'Code: 0';

    constructor(public executionId: number,
            public caseId: number,
            public trueCaseId: number,
            public stdin: string,
            public expectedStdout: string | null
    ) {}
}

export class SkippedResult extends Result {
    verdict: string = 'Skipped'; // Verdict
}

export class JudgingResult extends Result {
    verdict: string = 'Judging'; // Verdict
}

interface Execution {
    executionId: number;
    srcName: string;
    compileErrors: string[];
    results: (Result | SkippedResult)[];
}

export class ProgramExecutionManager {
    // state information
    private curProcs: ChildProcess[] = [];
    private executionCounter = -1;
    private halted: boolean = true;
    private curExecutor: Executor | undefined = undefined;
    private checker: string | undefined = undefined;

    // Result information
    public curExecution: Execution | undefined = undefined;

    // Config
    private config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('cptools.build');

    /**
     * Compiles the program and throws an error if the compile failed
     * @param src The source file path
     */
    compile(executor: Executor): void {
        executor.preExec();
        if (!isUndefined(executor.compileError)) {
            const fatal: boolean = isUndefined(executor.execFile);
            this.compileError(executor.compileError, fatal);
        }
    }

    private updateView(): void {
        outputDI!.emit({
            type: EventType.Update,
            event: this.curExecution
        });
    }

    private compileError(msg: string, fatal: boolean = false) {
        if (fatal) this.halted = true;
        this.curExecution!.compileErrors.push(msg);
        this.updateView();
    }
    
    /**
     * Executes the program for a sepcific case.  Completion events are handled by the eventemitters
     * @param executor The executor
     * @param caseId The case number
     * @param caseId The true case number of the case, when including disabled cases
     * @param input The input data
     * @param output The output data
     * @param checker The checker to use
     */
    executeCase(executor: Executor, caseId: number, trueCaseId: number, input: string, output: string | null, checker: CheckerFunction): Promise<Result> {
        return new Promise((res, _) => {
            const timeout = this.config.get<number>('timeout')!,
                memSampleRate = this.config.get<number>('memSample')!,
                charLimit = this.config.get<number>('charLimit')!;

            let proc = executor.exec();
            this.curProcs.push(proc);

            // State variables
            let truncatedStdout: boolean = false, truncatedStderr: boolean = false;
            let result: Result = new Result(this.executionCounter, caseId, trueCaseId, input, output);

            if (proc === null) {
                result.verdict = 'Internal Error';
                result.exitStatus = 'ChildProcess could not be initialized'; 
                res(result);
            }
            try {
                proc.stdin.write(input);
                if (!/\s$/.test(input))
                    this.compileError(`Input of case ${caseId} does not end in whitespace, this may cause stdin to wait forever for a delimiter`);
            }
            catch (e) {
                result.verdict = 'Internal Error';
                result.exitStatus = 'STDIN of child process closed prematurely.';
                res(result);
            }

            const beginTime: number = getTime();
                
            // exit and proc error management
            proc.on('error', (error: Error) => {
                result.verdict = 'Internal Error';
                result.exitStatus = `ChildProcess Error: ${error.name}: ${error.message}`;
                res(result);
            });
            proc.on('exit', (code: number, signal: string) => {
                clearTimeout(tleTimeout);

                // Checker related IE and Maybe verdicts
                let isCorrect, internalError = false, maybe = false;
                if (this.checker?.startsWith('custom') || (output !== null && output.length > 0)) { // If the checker is custom, expected output is not always required
                    try {
                        isCorrect = check(checker, result.stdin, result.stdout, output);
                    } catch (e) { // Checker problems man
                        internalError = true;
                        isCorrect = false;
                        result.verdict = 'Internal Error';
                        result.exitStatus = `Checker Error: ${e.stack}`;
                    }
                }
                else {
                    isCorrect = true;
                    maybe = true;
                    result.verdict = 'Maybe';
                }

                // Make sure that we know stderr and stdout are truncated if they are
                if (truncatedStdout) result.stdout += ' ... [clipped]';
                if (truncatedStderr) result.stderr += ' ... [clipped]';

                // set exit status
                if (!internalError && !maybe) {
                    result.exitStatus = createExitStatus(code, signal);
                    if (code !== 0 && signal === 'SIGTERM') result.verdict = 'Timeout';
                    else if (code !== 0) result.verdict = 'Runtime Error';
                    else if (isCorrect) result.verdict = 'Correct';
                    else result.verdict = 'Incorrect'; // Check if IE in case the result verdict was set already.  Don't want to overwrite it
                }

                // set runtime
                result.time = getTime() - beginTime;

                // Complete case
                res(result);
            });
            
            // Stream management
            proc.stdout.on('readable', () => {
                const data = proc.stdout.read();
                if (result.stdout.length === charLimit) return;
                if (data) result.stdout += data.toString();
                if (result.stdout.length > charLimit) { result.stdout = result.stdout.substring(0, charLimit); truncatedStdout = true; }
            });
            proc.stderr.on('readable', () => {
                const data = proc.stderr.read();
                if (result.stderr.length === charLimit) return;
                if (data) result.stderr += data.toString();
                if (result.stderr.length > charLimit) { result.stderr = result.stderr.substring(0, charLimit); truncatedStderr = true; }
            });
            
            // memory and time management
            const memCheckInterval = setInterval(() => {
                pidusage(proc.pid)
                .then(stat => { result.memory = Math.max(result.memory, stat.memory); })
                .catch(_ => { clearInterval(memCheckInterval); });
            }, memSampleRate);
            const tleTimeout = setTimeout(() => proc.kill(), timeout);
        });
    }
    
    /**
     * Runs the program
     */
    async run(): Promise<void> {
        // Get important variables
        const src = getSourceFile();
        const cases = testManager!.getCases(this.config.get<string>('curTestSet')!);

        // Initialization of state
        this.checker = cases.checker || this.config.get<string>('defaultChecker');
        this.halted = false;
        this.executionCounter++;
        this.curExecutor = getExecutor(src);
        this.curExecution = {
            executionId: this.executionCounter,
            srcName: src,
            compileErrors: [],
            results: [],
        };

        // Compile and whatnot
        log!.info(`Compling ${src}`);
        this.compile(this.curExecutor);
        try {
            var checkerFun = getCheckerFunction(this.checker!);
        } catch (e) { // error with checker
            this.compileError(`Checker Error: ${e.stack}`, true);
        }

        // Execute cases
        let counter = -1;
        for (const acase of cases.tests) { 
            counter++;
            this.curExecution!.results.push(new JudgingResult(this.executionCounter, counter, acase.index, '' , ''));
            this.updateView();

            let res: Result | SkippedResult;
            if (this.halted) {
                log!.warning(`Skipping case ${acase.index}`);
                res = new SkippedResult(this.executionCounter, counter, acase.index, acase.input, acase.output);
            }
            else {
                log!.info(`Executing case ${acase.index}`);
                res = await this.executeCase(this.curExecutor, counter, acase.index, acase.input, acase.output, checkerFun!);
            }

            // Fire event handlers and whatnot
            this.curExecution!.results[this.curExecution!.results.length - 1] = res;
            this.updateView();
        } 

        // If halted externally, return now
        if (this.halted) return;

        // Reset state
        this.curExecutor.postExec();
        this.curExecutor = undefined;
        this.curProcs.length = 0;
        this.halted = true;
        log!.info('Done!');
    }

    /**
     * Kills all current running procs and clears the procs array
     */
    private killAllProcs(): void {
        for (const proc of this.curProcs) proc.kill();
        this.curProcs.length = 0;
    }

    /**
     * Assuming that a case is currently running, this waits for the case to complete or for the specified
     * timeout parameter.
     */
    private async waitForCase(timeout: number = 1000): Promise<void> {
        return new Promise(res => {
            const id = setTimeout(() => {
                vscode.window.showErrorMessage('Waiting for case timed out');
                res();
            }, timeout);
        });
    }

    /**
     * Kills current running test case
     */
    async haltCurrentCase() {
        if (this.halted) return;
        this.killAllProcs();
        await this.waitForCase();
    }

    /**
     * Kills current running test case and skips remaining test cases
     */
    async haltAll() {
        if (this.halted) return;
        this.halted = true;
        this.killAllProcs();
        await this.waitForCase();
        this.curExecutor!.postExec();
        this.curExecutor = undefined;
    }
}
