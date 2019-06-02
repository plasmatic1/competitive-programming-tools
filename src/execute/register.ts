import * as vscode from 'vscode';
import * as fs from 'fs';
import * as exe from './events';
import * as pidusage from 'pidusage';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe } from '../undefinedutils';
import { optionManager } from '../extension';
import { ChildProcess } from 'child_process';
// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function getTime(): number {
    return new Date().getTime();
}

// ---------------------------------------------------------------------------
// Registering
// ---------------------------------------------------------------------------

interface BuildRunVars {
    srcFile: string;
    srcName: string;
    caseCount: number;
}

let lastView: vscode.WebviewPanel | undefined = undefined;

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        let currEditor = vscode.window.activeTextEditor;
        
        if (isUndefined(currEditor)) {
            vscode.window.showErrorMessage('No open file!');
            return;
        }
        
        // ---------------------------------------------------------------------------
        // Validating and getting input
        // ---------------------------------------------------------------------------
        const inputFilePath = optionManager().get('buildAndRun', 'inputFile');
        
        if (!fs.existsSync(inputFilePath)) {
            vscode.window.showErrorMessage(`Could not find input file ${inputFilePath}`);
            return;
        }        
        
        const inputs: string[] = fs.readFileSync(inputFilePath).toString().split(optionManager().get('buildAndRun', 'caseDelimeter'));

        // ---------------------------------------------------------------------------
        // Validating and getting executor
        // ---------------------------------------------------------------------------
        const srcFile: string = currEditor.document.uri.fsPath, 
            srcName: string = popUnsafe(srcFile.split('\\')),
            ext: string = popUnsafe(srcName.split('.')), 
            executorConstructor: (new(srcFile: string) => Executor) | undefined = executors.get(ext);
        console.log(`Compiling ${srcFile}, extension ${ext}...`);
        
        if (isUndefined(executorConstructor)) {
            vscode.window.showErrorMessage('File extension not supported yet!');
            return;
        }
        
        // ---------------------------------------------------------------------------
        // Initializing Web Panel
        // ---------------------------------------------------------------------------

        if (optionManager().get('buildAndRun', 'reuseWebviews') && !isUndefined(lastView)) {
            var display: vscode.WebviewPanel = lastView;
            display.reveal(vscode.ViewColumn.Active);
            display.webview.postMessage(new exe.ResetEvent(srcName, inputs.length));
        }
        else {
// tslint:disable-next-line: no-duplicate-variable
            var display: vscode.WebviewPanel = vscode.window.createWebviewPanel(
                'buildAndRun',
                'Build and Run',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            display.webview.html = getBuildRunHTML({
                srcFile,
                srcName,
                caseCount: inputs.length
            }, context);
    
            display.onDidDispose(() => {
                lastView = undefined;
            }, null, context.subscriptions);

            // Await for the webview to be ready
            await new Promise((resolve, _) => {
                display.webview.onDidReceiveMessage(msg => {
                    if (msg === 'ready') {
                        resolve();
                    }
                });
            });
        }

        display.title = `Output of '${srcName}'`;
        lastView = display;
            
        // ---------------------------------------------------------------------------
        // Web Panel Utility Functions
        // ---------------------------------------------------------------------------

        let eventQueue: exe.Event[] = [];
        function emitEvent(obj: exe.Event) {
            // Has to be like this (likely because of some this shenanigans)
            // This cannot simply be refractored to `const emitEvent = display.webview.postMessage;`
            if (display.visible) {
                display.webview.postMessage(obj);
            }
            else {
                eventQueue.push(obj);
            }
        }

        display.onDidChangeViewState(evt => {
            if (evt.webviewPanel.visible) {
                while (eventQueue.length) {
                    display.webview.postMessage(eventQueue.shift());
                }
            }
        });

        display.webview.onDidReceiveMessage(msg => {
            if (msg === 'unlink') {
                lastView = undefined;
            }
        });
            
        // ---------------------------------------------------------------------------
        // Compiling and Running Program
        // ---------------------------------------------------------------------------
        const executor: Executor = new executorConstructor(srcFile), timeout: number = optionManager().get('buildAndRun', 'timeout'),
            memSampleRate: number = optionManager().get('buildAndRun', 'memSample');
            
        executor.preExec();
            
        if (!isUndefined(executor.compileError)) {
            const fatal: boolean = isUndefined(executor.execFile);
            emitEvent(new exe.CompileErrorEvent(executor.compileError, fatal));
                
            if (fatal) {
                return;
            }
        }
            
        var caseNo = 0;
        for (const input of inputs) {
            var proc: ChildProcess = executor.exec();
            try {
                proc.stdin.write(input);
                emitEvent(new exe.BeginCaseEvent(input, caseNo));
            }
            catch (e) {
                // console.log(JSON.stringify(e));
                // if (e.message === 'write EPIPE') {
                    emitEvent(new exe.BeginCaseEvent('Stdin of program closed prematurely.', caseNo));
                // }
            }
                
            const beginTime: number = getTime();
            var done: boolean = false;
                
            // Event handlers and timed processes
            proc.on('error', (error: Error) => {
                done = true;
                emitEvent(new exe.CompileErrorEvent(`${error.name}: ${error.message}`, true));
            });
                
            proc.on('exit', (code: number, signal: string) => {
                done = true;
                emitEvent(new exe.UpdateTimeEvent(getTime() - beginTime, caseNo));
                    
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
                    
                emitEvent(new exe.EndEvent(exitMsg, caseNo));
            });
                
            proc.stdout.on('readable', () => {
                const data = proc.stdout.read();
                if (data) {
                    emitEvent(new exe.UpdateStdoutEvent(data.toString(), caseNo));
                }
            });
                
            proc.stderr.on('readable', () => {
                const data = proc.stderr.read();
                if (data) {
                    emitEvent(new exe.UpdateStderrEvent(data.toString(), caseNo));
                }
            });
                
            function updateMemAndTime() {
                pidusage(proc.pid)
                .then(stat => {
                    if (!done) {
                        emitEvent(new exe.UpdateTimeEvent(stat.elapsed, caseNo));
                    }
                    emitEvent(new exe.UpdateMemoryEvent(stat.memory, caseNo));
                })
                .catch(_ => {
                    clearInterval(memCheckInterval);
                });
            }
                
            updateMemAndTime();
            const memCheckInterval = setInterval(updateMemAndTime, memSampleRate);
                
            setTimeout(() => {
                if (!done) {
                    proc.kill();
                }
            }, timeout);

            display.webview.onDidReceiveMessage(msg => {
                if (msg === 'kill') {
                    proc.kill();
                }
            });
                
            // Check whether the program has terminated
            if (done) {
                caseNo++;
                continue;
            }
            await new Promise((resolve, _) => {
                   proc.on('exit', resolve);
            });

            // Increment Caseno
            caseNo++;
        }
            
        executor.postExec();
    });
        
    context.subscriptions.push(buildRunCommand);
}
    
function getBuildRunHTML(vars: BuildRunVars, context: vscode.ExtensionContext) { 
    return fs.readFileSync(join(context.extensionPath, 'out', 'execute', 'display.html'))
        .toString()
        .replace(/\$\{srcName\}/g, vars.srcName)
        .replace(/\$\{caseCount\}/g, vars.caseCount.toString());
}