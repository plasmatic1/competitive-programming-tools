import * as vscode from 'vscode';
import { CompileErrorEvent, BeginCaseEvent, UpdateTimeEvent, EndEvent, UpdateStdoutEvent, UpdateStderrEvent, UpdateMemoryEvent, ResetEvent } from './events';
import * as pidusage from 'pidusage';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe, readWorkspaceFile, errorIfUndefined } from '../extUtils';
import { optionManager, buildRunDI, CASES_PATH } from '../extension';
import { ChildProcess } from 'child_process';
import { BuildRunDI } from '../display/buildRunDisplayInterface';

interface Case {
    input: string;
    output: string;
}

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
// tslint:disable: curly
function createExitMessage(code: number, signal: string): string[] {
    if (!isNull(signal))
        return ['Killed by Signal:', signal + (signal === 'SIGTERM' ? ' (Possible timeout?)' : '')];

    var extra = '';
    if (code > 255)
        extra = ' (Possible Segmentation Fault?)';
    else if (code === 3)
        extra = ' (Assertion failed!)';

    return ['Exit code:', code + extra];
}
// tslint:enable: curly

/**
 * Compares two output string, based on configuration settings.  For example, if the output comparison style is set to "token", it will compare individual tokens, and if 
 * the output comparison style is set to "exact", it will compare exact values
 * @param output1 The first output string
 * @param output2 The second output string
 */
function compareOutput(output1: string, output2: string): boolean {
    // TODO: implement different comparison styles
    return output1 === output2;
}

/**
 * Resolves the test cases.  Throws an error if test cases could not be found
 */
function getTestCases(): Case[] {
    const cases = JSON.parse(readWorkspaceFile(CASES_PATH, '[]'));
    if (cases.length === 0) {
        throw new Error('No test cases!');
    }
    return cases;
}

/**
 * Returns the source file from the current file open.  If no file is open, an error is thrown
 * @returns The source file name
 */
function getSourceFile(): string {
    let currEditor = vscode.window.activeTextEditor;
    if (isUndefined(currEditor)) {
        throw new Error('No open file!');
    }

    const srcFile: string = currEditor.document.uri.fsPath;
    return srcFile;
}

/**
 * Resolves the executor for that source file.  Throws an error if the executor was not found
 * @param src The source file path
 */
function getExecutor(src: string): Executor {
    const srcName = popUnsafe(src.split('\\')),
        ext = popUnsafe(srcName.split('.')), 
        executorConstructor = executors.get(ext);
    if (isUndefined(executorConstructor)) {
        throw new Error(`Extension ${ext} not supported!`);
    }

    return new executorConstructor(src);
}

class ProgramExecutionManager {
    private curProcs: ChildProcess[] = [];
    private halted: boolean = false;
    private curExecutor: Executor | undefined;

    // Singletons
    constructor (
        private readonly displayInterface: BuildRunDI
    ) {

    }

    /**
     * Compiles the program and throws an error if the compile failed
     * @param src The source file path
     */
    compile(executor: Executor): void {
        executor.preExec();
                
        if (!isUndefined(executor.compileError)) {
            const fatal: boolean = isUndefined(executor.execFile);
            this.displayInterface.emit(new CompileErrorEvent(executor.compileError, fatal));
                
            if (fatal) {
                return;
            }
        }
    }

    /**
     * Errors if the execution has been halted
     */
    checkForHalted(): void {
        if (this.halted) {
            throw new Error("Program has been halted!");
        }
    }

    /**
     * Executes the program for a sepcific case and throws any errors if they are encountered.  It's returned as a promise
     * @param executor The executor
     * @param caseNo The case number
     * @param input The input data
     * @param output The output data
     */
    executeCase(executor: Executor, caseNo: number, input: string, output: string | undefined): Promise<void> {
        return new Promise((res, _) => {
            const timeout = optionManager().get('buildAndRun', 'timeout'),
                memSampleRate = optionManager().get('buildAndRun', 'memSample');

            let proc = executor.exec();
            this.curProcs.push(proc);
            let procOutput = "";

            if (proc === null) {
                this.displayInterface.emit(new CompileErrorEvent(`Process for case ${caseNo} could not be initialized`, true));
                res();
            }

            try {
                proc.stdin.write(input);
                this.displayInterface.emit(new BeginCaseEvent(input, output, caseNo));

                if (!/\s$/.test(input)) {
                    this.displayInterface.emit(new CompileErrorEvent(`Input for Case #${caseNo + 1} does not end in whitespace, this may cause issues (such as cin waiting forever for a delimiter)`, false));
                }
            }
            catch (e) {
                this.displayInterface.emit(new BeginCaseEvent('STDIN of program closed prematurely.', output, caseNo));
            }

            const beginTime: number = getTime();
                
            // Event handlers and timed processes
            proc.on('error', (error: Error) => {
                this.displayInterface.emit(new CompileErrorEvent(`${error.name}: ${error.message}`, true));
                res();
            });
                
            // tslint:disable: curly
            proc.on('exit', (code: number, signal: string) => {
                clearTimeout(tleTimeout);
                this.displayInterface.emit(new UpdateTimeEvent(getTime() - beginTime, caseNo));

                let isCorrect;
                if (!isUndefined(output) && output.length > 0) 
                    isCorrect = compareOutput(output, procOutput);
                else
                    isCorrect = true;
                
                this.displayInterface.emit(new EndEvent(createExitMessage(code, signal), isCorrect, code !== 0, caseNo));
                res();
            });
            // tslint:enable: curly
            
            proc.stdout.on('readable', () => {
                const data = proc.stdout.read();
                if (data) {
                    procOutput += data.toString();
                    this.displayInterface.emit(new UpdateStdoutEvent(data.toString(), caseNo));
                }
            });
                
            proc.stderr.on('readable', () => {
                const data = proc.stderr.read();
                if (data) { this.displayInterface.emit(new UpdateStderrEvent(data.toString(), caseNo)); }
            });
            
            // Memory and time live update
            const memCheckInterval = setInterval(() => {
                pidusage(proc.pid)
                .then(stat => {
                    this.displayInterface.emit(new UpdateTimeEvent(stat.elapsed, caseNo));
                    this.displayInterface.emit(new UpdateMemoryEvent(stat.memory, caseNo));
                })
                .catch(_ => {
                    clearInterval(memCheckInterval);
                });
            }, memSampleRate);
            
            const tleTimeout = setTimeout(() => proc.kill(), timeout);
        });
    }

    /**
     * Resets ths display for a new execution of a program; # of cases should be specified.  This function returns a promise that resolves when the response
     * to the reset event is received from the webview
     * @param caseCnt Number of cases
     */
    async resetDisplay(caseCnt: number): Promise<void> {
        return new Promise((res, _) => {
            this.displayInterface.emit(new ResetEvent(caseCnt));
            buildRunDI().waitForResetResponse().then(res);
        });
    }

    /**
     * Runs the program
     */
    async run(): Promise<void> {
        const src = getSourceFile();
        const executor = this.curExecutor = getExecutor(src);
        const cases = getTestCases();

        this.checkForHalted();
        this.compile(executor);
        this.resetDisplay(cases.length);
        let counter = 0;
        for (const acase of cases) {
            this.checkForHalted();
            await this.executeCase(executor, counter++, acase.input, acase.output);
        }
        executor.postExec();
        this.curExecutor = undefined;
    }

    /**
     * Kills current running process
     */
    halt(): void {
        for (const proc of this.curProcs) { proc.kill(); }
        this.curProcs.length = 0;
        this.halted = true;
        errorIfUndefined(this.curExecutor, 'Current executor is undefined??').postExec();
    }

    /**
     * Clears procs array (assuming execution finished)
     */
    clearProcs(): void {
        this.curProcs.length = 0;
    }
}

export class ProgramExecutionManagerDriver {
    curExecution: ProgramExecutionManager | undefined = undefined;

    constructor (
        private readonly displayInterface: BuildRunDI
    ) {
        // Fill in if needed
    }

    /**
     * Attempts to compile and run whatever open program the use has
     */
    async run(): Promise<void> {
        try {
            this.curExecution = new ProgramExecutionManager(this.displayInterface);
            await this.curExecution.run();
            this.curExecution.clearProcs();
            this.curExecution = undefined;
        }
        catch (e) {
            vscode.window.showErrorMessage(e.toString());
            console.log(e);
        }
    }

    /**
     * Halts a currently running process (if one exists)
     */
    halt(): void {
        if (!isUndefined(this.curExecution)) {
            this.curExecution.halt();
            this.curExecution = undefined;
        }
        // tslint:disable-next-line: curly
        else
            vscode.window.showErrorMessage('Attempted halt while no program was running!');
    }
}
