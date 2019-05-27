import * as vscode from 'vscode';
import * as fs from 'fs';
import { Executor, executors } from './executors';
import { isUndefined } from 'util';
import { popUnsafe } from '../undefinedutils';
import { optionManager } from '../extension';
import { ChildProcess } from 'child_process';
import * as exe from './events';

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
        });
        
        // -----------------------------------------------------------------------------------------------------------------------------
        // Web Panel Utility Functions
        // -----------------------------------------------------------------------------------------------------------------------------
        const emitEvent = display.webview.postMessage;

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
        else {
            for (const input of inputs) {
                var proc: ChildProcess = executor.exec();
                proc.stdin.write(input);

                const beginTime: number = getTime();
                var error: string | undefined = undefined, done: boolean = false;

                proc.on('error', (error_: Error) => {
                    error = error_.message;
                });

                proc.on('exit', (code: number, signal: string) => {
                    done = true;
                    emitEvent(new exe.UpdateTimeEvent(getTime() - beginTime));
                });

                proc.stdout.on('readable', () => {
                    emitEvent(new exe.UpdateStdoutEvent(proc.stdout.read()));
                });

                proc.stderr.on('readable', () => {
                    emitEvent(new exe.UpdateStderrEvent(proc.stderr.read()));
                });

                setTimeout(() => {
                    if (!done) {
                        proc.kill();
                    }
                }, timeout);

                const memCheckTimeout = setTimeout(() => {
                    
                }, memSampleRate);

                // wheeeee
            }
            executor.postExec();
        }
    });
    
    context.subscriptions.push(buildRunCommand);
}

//TODO: CHANGE TO TRUE IF EXPORTING
const debugDisplayPanel: boolean = true;

function getBuildRunHTML(vars: BuildRunVars) {
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
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue${debugDisplayPanel ? '' : '.min'}.js"></script>
    <script>
        ${fs.readFileSync('display.js')}
    </script>
</body>
</html>`;
}