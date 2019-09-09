import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompileErrorEvent, BeginCaseEvent, UpdateTimeEvent, EndEvent, UpdateStdoutEvent, UpdateStderrEvent, UpdateMemoryEvent } from './events';
import * as pidusage from 'pidusage';
import * as display from '../display/displayManager';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe, readWorkspaceFile } from '../extUtils';
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

/**
 * Executes the program and throws any errors if they are encountered.  It's returned as a promise
 * @param executor The executor
 * @param caseno The case number
 * @param input The input data
 * @param output The output data
 */
async function execute(executor: Executor, caseno: number, input: string, output: string | undefined): Promise<void> {
    return new Promise(function(res, rej) {
        const timeout = optionManager().get('buildAndRun', 'timeout'),
            memSampleRate = optionManager().get('buildAndRun', 'memSample');

        let proc = executor.exec();

        try {
            proc.stdin.write(input);
            emitEvent(new BeginCaseEvent(input, caseno));

            if (!/\s$/.test(input)) {
                emitEvent(new CompileErrorEvent(`Input for Case #${caseno + 1} does not end in whitespace, this may cause issues (such as cin waiting forever for a delimiter)`, false));
            }
        }
        catch (e) {
            emitEvent(new BeginCaseEvent('STDIN of program closed prematurely.', caseno));
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
                
            var exitMsg = [];
                
            if (!isNull(signal)) {
                exitMsg = ['Killed by Signal:', signal + (signal === 'SIGTERM' ? ' (Possible timeout?)' : '')];
            }
            else {
                var extra = '';
                if (code > 255) {
                    extra = ' (Possible Segmentation Fault?)';
                }
                else if (code === 3) {
                    extra = ' (Assertion failed!)';
                }

                exitMsg = ['Exit code:', code + extra];
            }
                
            emitEvent(new EndEvent(exitMsg, caseno));
            res();
        });
            
        proc.stdout.on('readable', () => {
            const data = proc.stdout.read();
            if (data) { emitEvent(new UpdateStdoutEvent(data.toString(), caseno)); }
        });
            
        proc.stderr.on('readable', () => {
            const data = proc.stderr.read();
            if (data) { emitEvent(new UpdateStderrEvent(data.toString(), caseno)); }
        });
            
        function updateMemAndTime() {
            pidusage(proc.pid)
            .then(stat => {
                emitEvent(new UpdateTimeEvent(stat.elapsed, caseno));
                emitEvent(new UpdateMemoryEvent(stat.memory, caseno));
            })
            .catch(_ => {
                clearInterval(memCheckInterval);
            });
        }
            
        updateMemAndTime();
        const memCheckInterval = setInterval(updateMemAndTime, memSampleRate);
        const tleTimeout = setTimeout(() => proc.kill(), timeout);
    });
}

/**
 * Bundles all three operations together and attaches any required event handlers.  If anything fails, an error will be thrown.
 */
function _run(): void {
    
}   

/**
 * Wrapper around the _run() function that catches Exceptions and turns them into proper error messages
 */
export function run(): void {
    try {
        _run(src);
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

}
