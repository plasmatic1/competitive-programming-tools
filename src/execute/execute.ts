import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompileErrorEvent, BeginCaseEvent, UpdateTimeEvent, EndEvent, UpdateStdoutEvent, UpdateStderrEvent, UpdateMemoryEvent, CompareOutputEvent } from './events';
import * as pidusage from 'pidusage';
import * as display from '../display/displayManager';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe, readWorkspaceFile, errorIfUndefined } from '../extUtils';
import { optionManager, CASES_PATH } from '../extension';
import { ChildProcess } from 'child_process';

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
function createExitMessage(code: number, signal: string): string[] {
    if (!isNull(signal)) {
        return ['Killed by Signal:', signal + (signal === 'SIGTERM' ? ' (Possible timeout?)' : '')];
    }

    var extra = '';
    if (code > 255) {
        extra = ' (Possible Segmentation Fault?)';
    }
    else if (code === 3) {
        extra = ' (Assertion failed!)';
    }

    return ['Exit code:', code + extra];
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
 * @param event Emits an event of the BuildAndRun type
 */
function emitEvent(event: any) {
    display.emit({
        type: display.EventType.BuildAndRun,
        event
    });
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

/**
 * Compiles the program and throws an error if the compile failed
 * @param src The source file path
 */
function compile(executor: Executor): void {
    executor.preExec();
            
    if (!isUndefined(executor.compileError)) {
        const fatal: boolean = isUndefined(executor.execFile);
        emitEvent(new CompileErrorEvent(executor.compileError, fatal));
            
        if (fatal) {
            return;
        }
    }
}

export class ProgramExecution {
    private curProcs: ChildProcess[] = [];
    private halted: boolean = false;
    private curExecutor: Executor | undefined;

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
     * @param caseno The case number
     * @param input The input data
     * @param output The output data
     */
    async executeCase(executor: Executor, caseno: number, input: string, output: string | undefined): Promise<void> {
        return new Promise(function(res, _) {
            const timeout = optionManager().get('buildAndRun', 'timeout'),
                memSampleRate = optionManager().get('buildAndRun', 'memSample');

            let proc = executor.exec();
            let procOutput = "";

            try {
                proc.stdin.write(input);
                emitEvent(new BeginCaseEvent(input, output, caseno));

                if (!/\s$/.test(input)) {
                    emitEvent(new CompileErrorEvent(`Input for Case #${caseno + 1} does not end in whitespace, this may cause issues (such as cin waiting forever for a delimiter)`, false));
                }
            }
            catch (e) {
                emitEvent(new BeginCaseEvent('STDIN of program closed prematurely.', output, caseno));
            }

            const beginTime: number = getTime();
                
            // Event handlers and timed processes
            proc.on('error', (error: Error) => {
                emitEvent(new CompileErrorEvent(`${error.name}: ${error.message}`, true));
                res();
            });
                
            proc.on('exit', (code: number, signal: string) => {
                clearTimeout(tleTimeout);
                emitEvent(new UpdateTimeEvent(getTime() - beginTime, caseno));
                if (!isUndefined(output)) { emitEvent(new CompareOutputEvent(output.trim() === procOutput.trim(), caseno)); }
                else { emitEvent(new CompareOutputEvent(true, caseno)); }
                emitEvent(new EndEvent(createExitMessage(code, signal), caseno));
                res();
            });
            
            proc.stdout.on('readable', () => {
                const data = proc.stdout.read();
                if (data) {
                    procOutput += data.toString();
                    emitEvent(new UpdateStdoutEvent(data.toString(), caseno));
                }
            });
                
            proc.stderr.on('readable', () => {
                const data = proc.stderr.read();
                if (data) { emitEvent(new UpdateStderrEvent(data.toString(), caseno)); }
            });
            
            // Memory and time live update
            const memCheckInterval = setInterval(function updateMemAndTime() {
                pidusage(proc.pid)
                .then(stat => {
                    emitEvent(new UpdateTimeEvent(stat.elapsed, caseno));
                    emitEvent(new UpdateMemoryEvent(stat.memory, caseno));
                })
                .catch(_ => {
                    clearInterval(memCheckInterval);
                });
            }, memSampleRate);
            
            const tleTimeout = setTimeout(() => proc.kill(), timeout);
        });
    }

    /**
     * Resets ths display for a new execution of a program.  This sends an event to the webview then waits for a response
     */
    async resetDisplay(): Promise<void> {
        return new Promise(function(res, _) {
            // TODO: implement
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
        compile(executor);
        let counter = 1;
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
}

let curExecution: ProgramExecution | undefined;

/**
 * Attempts to compile and run whatever open program the use has
 */
export async function run(): Promise<void> {
    try {
        curExecution = new ProgramExecution();
        await curExecution.run();
        curExecution = undefined;
    }
    catch (e) {
        vscode.window.showErrorMessage(e);
        console.log(e);
    }
}

/**
 * Halts a currently running process (if one exists)
 */
export function halt(): void {
    errorIfUndefined(curExecution, 'Program is not running!').halt();
    curExecution = undefined;
}
