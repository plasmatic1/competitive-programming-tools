import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as exe from './events';
import * as pidusage from 'pidusage';
import { getWebview, unlinkWebview } from '../display/displayInterface';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe } from '../extUtils';
import { optionManager } from '../extension';
import { ChildProcess } from 'child_process';
// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function getTime(): number {
    return new Date().getTime();
}

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        // ---------------------------------------------------------------------------
        // Compiling and Running Program
        // ---------------------------------------------------------------------------
        const executor: Executor = new executorConstructor(srcFile), timeout: number = optionManager().get('buildAndRun', 'timeout'),
            memSampleRate: number = optionManager().get('buildAndRun', 'memSample');
            
        var caseNo = 0;
        for (const input of inputs) {
            let curCaseNo = caseNo; // Prevent Concurrency Issues
            var proc: ChildProcess = executor.exec();
            try {
                proc.stdin.write(input);
                emitEvent(new exe.BeginCaseEvent(input, curCaseNo));

                if (!/\s$/.test(input)) {
                    emitEvent(new exe.CompileErrorEvent(`Input for Case #${curCaseNo + 1} does not end in whitespace, this may cause issues (such as cin waiting forever for a delimiter)`, false));
                }
            }
            catch (e) {
                emitEvent(new exe.BeginCaseEvent('STDIN of program closed prematurely.', curCaseNo));
            }
                
            const beginTime: number = getTime();
            var done: boolean = false;
                
            // Event handlers and timed processes
            proc.on('error', (error: Error) => {
                done = true;
                emitEvent(new exe.CompileErrorEvent(`${error.name}: ${error.message}`, true));
            });
                
            proc.on('exit', (code: number, signal: string) => {
                clearTimeout(tleTimeout);
                emitEvent(new exe.UpdateTimeEvent(getTime() - beginTime, curCaseNo));
                    
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
                    
                emitEvent(new exe.EndEvent(exitMsg, curCaseNo));
            });
                
            proc.stdout.on('readable', () => {
                const data = proc.stdout.read();
                if (data) {
                    // console.log(data.toString());
                    emitEvent(new exe.UpdateStdoutEvent(data.toString(), curCaseNo));
                }
            });
                
            proc.stderr.on('readable', () => {
                const data = proc.stderr.read();
                if (data) {
                    emitEvent(new exe.UpdateStderrEvent(data.toString(), curCaseNo));
                }
            });
                
            function updateMemAndTime() {
                pidusage(proc.pid)
                .then(stat => {
                    if (!done) {
                        emitEvent(new exe.UpdateTimeEvent(stat.elapsed, curCaseNo));
                    }
                    emitEvent(new exe.UpdateMemoryEvent(stat.memory, curCaseNo));
                })
                .catch(_ => {
                    clearInterval(memCheckInterval);
                });
            }
                
            updateMemAndTime();
            const memCheckInterval = setInterval(updateMemAndTime, memSampleRate);
            const tleTimeout = setTimeout(() => proc.kill(), timeout);

            display.webview.onDidReceiveMessage(msg => {
                if (msg === 'kill') {
                    proc.kill();
                }
            });
                
            // Check whether the program has terminated
            if (!done) {
                await new Promise((resolve, _) => {
                    proc.on('exit', resolve);
                });
            }

            // Increment Caseno and other cleanup
            caseNo++;
        }
            
        executor.postExec();
    });
        
    context.subscriptions.push(buildRunCommand);
}
