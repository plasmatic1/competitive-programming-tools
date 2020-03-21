import * as vscode from 'vscode';
import * as pidusage from 'pidusage';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe, readWorkspaceFile, errorIfUndefined } from '../extUtils';
import { optionManager, outputDI, testManager } from '../extension';
import { ChildProcess } from 'child_process';
import { EventType } from '../display/outputDisplayInterface';

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
 * Compares two output string, based on configuration settings.  For example, if the output comparison style is set to "token", it will compare individual tokens, and if 
 * the output comparison style is set to "exact", it will compare exact values
 * @param output1 The first output string
 * @param output2 The second output string
 */
function compareOutput(output1: string, output2: string): boolean {
    // TODO: implement different comparison styles
    return output1.trim() === output2.trim();
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
        executorConstructor = errorIfUndefined(executors.get(ext), `Extension ${ext} not supported!`);
    return new executorConstructor(src);
}

// Result Classes
// Note that executionId should always count up

export class SkippedResult {
    executionId = -1; // The execution id of this result (this is an id assigned to it based on the execution).  This is to distinguish different test cases and prevent a certain race case.
    caseId: number = -1;
    verdict: string = 'Skipped'; // Verdict
    stdin: string = ''; // Stdin data (SET THIS PROPERLY)
    stdout: string = ''; // Stdout data (can leave as default)
    stderr: string = ''; // Stderr data (can leave as default)
    expectedStdout: string | null = null; // Expected stdout (SET THIS PROPERLY)
}

export class Result {
    executionId = -1; // The execution id of this result (this is an id assigned to it based on the execution).  This is to distinguish different test cases and prevent a certain race case.
    caseId: number = -1; // Test case number, 0-indexed
    stdin: string = ''; // Stdin data
    stdout: string = ''; // Stdout data
    stderr: string = ''; // Stderr data
    expectedStdout: string | null = null; // Expected stdout
    verdict: string = 'Waiting'; // Verdict
    time: number = 0; // Time
    memory: number = 0;
    exitStatus: string = 'Code: 0';
}

class CompileError {
    executionId = -1; // The execution id of this result (this is an id assigned to it based on the execution).  This is to distinguish different test cases and prevent a certain race case.
    message: string | undefined = undefined;
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

    // Result information
    private onCompleteCase: vscode.EventEmitter<void> = new vscode.EventEmitter();
    public previousExecution: Execution | undefined = undefined;

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

    private compileError(msg: string, fatal: boolean = false) {
        if (fatal) this.halted = true;
        outputDI!.emit({
            type: EventType.CompileError, 
            event: {
                executionId: this.executionCounter,
                message: msg
            }
        });
        this.previousExecution!.compileErrors.push(msg);
    }
    
    /**
     * Executes the program for a sepcific case.  Completion events are handled by the eventemitters
     * @param executor The executor
     * @param caseId The case number
     * @param input The input data
     * @param output The output data
     */
    executeCase(executor: Executor, caseId: number, input: string, output: string | null): Promise<Result> {
        return new Promise((res, rej) => {
            const timeout = optionManager!.get('buildAndRun', 'timeout'),
                memSampleRate = optionManager!.get('buildAndRun', 'memSample'),
                charLimit = optionManager!.get('buildAndRun', 'charLimit');

            let proc = executor.exec();
            this.curProcs.push(proc);

            // State variables
            let truncatedStdout: boolean = false, truncatedStderr: boolean = false;
            let result: Result = new Result();
            result.caseId = caseId;
            result.executionId = this.executionCounter;
            result.stdin = input;
            result.expectedStdout = output;

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
                let isCorrect;
                if (output !== null && output.length > 0) isCorrect = compareOutput(output, result.stdout);
                else isCorrect = true;

                // Make sure that we know stderr and stdout are truncated if they are
                if (truncatedStdout) result.stdout += ' ... [clipped]';
                if (truncatedStderr) result.stderr += ' ... [clipped]';

                // set exit status
                result.exitStatus = createExitStatus(code, signal);
                if (code !== 0 && signal === 'SIGTERM') result.verdict = 'Timeout';
                else if (code !== 0) result.verdict = 'Runtime Error';
                else if (isCorrect) result.verdict = 'Correct';
                else result.verdict = 'Incorrect';

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
     * Inits display for new cases
     */
    private async initDisplay(sourceFile: string, caseCount: number) {
        outputDI!.emit({
            type: EventType.Init, 
            event: {
                executionId: this.executionCounter,
                caseCount,
                sourceName: sourceFile.replace(/\\/g, '/').split('/').pop()
            }
        });
        await outputDI!.waitForInitResponse();
    }

    /**
     * Runs the program
     */
    async run(): Promise<void> {
        // Get important variables
        const src = getSourceFile();
        const cases = testManager!.getCases(optionManager!.get('buildAndRun', 'curTestSet'));

        // Initialization of state
        this.halted = false;
        this.executionCounter++;
        this.curExecutor = getExecutor(src);
        this.previousExecution = {
            executionId: this.executionCounter,
            srcName: src,
            compileErrors: [],
            results: [],
        };

        // Execute cases
        await this.initDisplay(src, cases.length); 
        this.compile(this.curExecutor);
        let counter = -1;
        for (const acase of cases) { 
            counter++;
            outputDI!.emit({ type: EventType.BeginCase, event: { executionId: this.executionCounter, caseId: counter }});

            let res: Result | SkippedResult;
            if (this.halted) {
                res = new SkippedResult();
                res.executionId = this.executionCounter;
                res.caseId = counter;
                res.stdin = acase.input;
                res.expectedStdout = acase.output;
            }
            else
                res = await this.executeCase(this.curExecutor, counter, acase.input, acase.output);

            // Fire event handlers and whatnot
            outputDI!.emit({
                type: EventType.EndCase,
                event: res
            });
            this.previousExecution!.results.push(res);
            this.onCompleteCase.fire();
        } 

        // If halted externally, return now
        if (this.halted) return;

        // Reset state
        this.curExecutor.postExec();
        this.curExecutor = undefined;
        this.curProcs.length = 0;
        this.halted = true;
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
            let handle = this.onCompleteCase.event(() => {
                clearTimeout(id);
                res();
                handle.dispose();
            });
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
