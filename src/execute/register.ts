import * as vscode from 'vscode';
import * as fs from 'fs';
import * as exe from './events';
import * as pidusage from 'pidusage';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe } from '../undefinedutils';
import { optionManager, extensionContext } from '../extension';
import { ChildProcess } from 'child_process';
import { on } from 'cluster';
import { AssertionError } from 'assert';

// -----------------------------------------------------------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------------------------------------------------------

function getTime(): number {
    return new Date().getTime();
}

// -----------------------------------------------------------------------------------------------------------------------------
// Registering
// -----------------------------------------------------------------------------------------------------------------------------

interface BuildRunVars {
    srcFile: string;
}

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        let currEditor = vscode.window.activeTextEditor;
        
        if (isUndefined(currEditor)) {
            vscode.window.showErrorMessage('No open file!');
            return;
        }
        
        // -----------------------------------------------------------------------------------------------------------------------------
        // Validating and getting input
        // -----------------------------------------------------------------------------------------------------------------------------
        const inputFilePath = optionManager().get('buildAndRun', 'inputFile');
        
        if (!fs.existsSync(inputFilePath)) {
            vscode.window.showErrorMessage(`Could not find input file ${inputFilePath}`);
            return;
        }        
        
        const inputs: string[] = fs.readFileSync(inputFilePath).toString().split(optionManager().get('buildAndRun', 'caseDelimeter'));
        
        // -----------------------------------------------------------------------------------------------------------------------------
        // Validating and getting executor
        // -----------------------------------------------------------------------------------------------------------------------------
        const srcFile: string = currEditor.document.uri.fsPath, 
        ext: string = popUnsafe(popUnsafe(srcFile.split('\\')).split('.')), 
        executorConstructor: (new(srcFile: string) => Executor) | undefined = executors.get(ext);
        console.log(`Compiling ${srcFile}, extension ${ext}...`);
        
        if (isUndefined(executorConstructor)) {
            vscode.window.showErrorMessage('File extension not supported yet!');
            return;
        }
        
        // -----------------------------------------------------------------------------------------------------------------------------
        // Initializing Web Panel
        // -----------------------------------------------------------------------------------------------------------------------------
        const display = vscode.window.createWebviewPanel(
            'buildAndRun',
            'Build and Run',
            vscode.ViewColumn.Active,
            {
                'enableScripts': true
            }
            );
            
            display.webview.html = getBuildRunHTML({
                srcFile
            }, context);
            
            // -----------------------------------------------------------------------------------------------------------------------------
            // Web Panel Utility Functions
            // -----------------------------------------------------------------------------------------------------------------------------
            function emitEvent(obj: any) {
                // Has to be like this (likely because of some this shenanigans)
                // This cannot simply be refractored to
                // `const emitEvent = display.webview.postMessage;`
                console.log(JSON.stringify(obj));
                display.webview.postMessage(obj);
            }
            
            // -----------------------------------------------------------------------------------------------------------------------------
            // Compiling and Running Program
            // -----------------------------------------------------------------------------------------------------------------------------
            const executor: Executor = new executorConstructor(srcFile), timeout: number = optionManager().get('buildAndRun', 'timeout'),
            memSampleRate: number = optionManager().get('buildAndRun', 'memSample');
            
            executor.preExec();
            
            if (!isUndefined(executor.compileError)) {
                const fatal: boolean = !!executor.execFile;
                emitEvent(new exe.CompileErrorEvent(executor.compileError, fatal));
                
                if (fatal) {
                    return;
                }
            }
            
            for (const input of inputs) {
                var proc: ChildProcess = executor.exec();
                proc.stdin.write(input);
                
                const beginTime: number = getTime();
                var done: boolean = false;
                
                // Check whether the program has terminated
                async function checkDone() {
                    return new Promise((resolve, _) => {
                        proc.on('exit', resolve);
                    });
                }
                
                // Event handlers and timed processes
                proc.on('error', (error: Error) => {
                    done = true;
                    emitEvent(new exe.CompileErrorEvent(`${error.name}: ${error.message}`, true));
                });
                
                proc.on('exit', (code: number, signal: string) => {
                    done = true;
                    emitEvent(new exe.UpdateTimeEvent(getTime() - beginTime));
                    
                    var exitMsg = '';
                    
                    if (!isNull(signal)) {
                        exitMsg = `Killed by Signal: ${signal}` + (signal === 'SIGTERM' ? ' (Possible timeout?)' : '');
                    }
                    else {
                        exitMsg = `Exit code: ${code}` + (code > 255 ? ' (Possible Segmentation Fault?)' : '');
                    }
                    
                    emitEvent(new exe.EndEvent(exitMsg));
                });
                
                proc.stdout.on('readable', () => {
                    const data = proc.stdout.read();
                    if (data) {
                        emitEvent(new exe.UpdateStdoutEvent(data));
                    }
                });
                
                proc.stderr.on('readable', () => {
                    const data = proc.stderr.read();
                    if (data) {
                        emitEvent(new exe.UpdateStderrEvent(data));
                    }
                });
                
                function updateMemAndTime() {
                    pidusage(proc.pid)
                    .then(stat => {
                        if (!done) {
                            emitEvent(new exe.UpdateTimeEvent(stat.elapsed));
                        }
                        emitEvent(new exe.UpdateMemoryEvent(stat.memory));
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
                
                // Awaiting termination
                await checkDone();
            }
            
            executor.postExec();
        });
        
        context.subscriptions.push(buildRunCommand);
    }
    
    //TODO: CHANGE TO TRUE IF EXPORTING
    const debugDisplayPanel: boolean = true;
    
    function getBuildRunHTML(vars: BuildRunVars, context: vscode.ExtensionContext) {
        let srcName = vars.srcFile.split('\\').pop();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Output of "${srcName}"</title>
        </head>
        <body>
            <h1>Output of "${srcName}"</h1>
        
            <div id="compileError" v-if="data !== ''">
                <h2>Compile Errors</h2>
                {{ data }}
            </div>
        
            <div id="cases" v-if="visible">
                <div v-for="curCase in cases">
                    <h2>Case #{{ curCase.id }}</h2>
        
                    <div v-if="curCase.stdinVisible">
                        <h3>Input</h3>
                        <pre><code>
                            {{ curCase.stdin }}
                        </code></pre>
                    </div>
                    <button v-on:click="toggleVar.bind(undefined, curCase.id, 'stdinVisible')">Toggle Input</button>
        
                    <div v-if="curCase.stdoutVisible">
                        <h3>Output</h3>
                        <pre><code>
                            {{ curCase.stdout }}
                        </code></pre>
                    </div>
                    <button v-on:click="toggleVar.bind(undefined, curCase.id, 'stdoutVisible')">Toggle Output</button>
        
                    <div v-if="curCase.stderrVisible">
                        <h3>Errors</h3>
                        <pre><code>
                            {{ curCase.stderr }}
                        </code></pre>
                    </div>
                    <button v-on:click="toggleVar.bind(undefined, curCase.id, 'stderrVisible')">Toggle Errors</button>
        
                    <div>
                        <h4>Info</h4>
                        <p>Time Elapsed: {{ curCase.time }}ms</p>
                        <p>Memory Usage: {{ Math.round(curCase.memory / 1024 * 1000) / 1000 }}
                        <p v-if="curCase.exitInfo !== ''">{{ curCase.exitInfo }}</p>
                    </div>
                </div>
            </div>
        
            <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue${debugDisplayPanel ? '' : '.min'}.js"></script>
            <script>
                ${fs.readFileSync(join(context.extensionPath, 'src', 'execute', 'display.js'))}
            </script>
        </body>
        </html>`;
    }