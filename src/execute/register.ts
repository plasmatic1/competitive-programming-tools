import * as vscode from 'vscode';
import * as fs from 'fs';
import { interpretReturnBuffer, Executor, executors, Result, ResultType } from './executors';
import { isUndefined } from 'util';
import { popUnsafe } from '../undefinedutils';
import { optionManager } from '../extension';

interface BuildRunVars {
    srcFile: string;
    results: Result[];
}

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
		let currEditor = vscode.window.activeTextEditor;

		if (isUndefined(currEditor)) {
			vscode.window.showErrorMessage('No open file!');
			return;
        }
        
        // Getting input
        const inputFilePath = optionManager().get('buildAndRun', 'inputFile');
        
        if (!fs.existsSync(inputFilePath)) {
            vscode.window.showErrorMessage(`Could not find input file ${inputFilePath}`);
            return;
        }

        const inputs: string[] = fs.readFileSync(inputFilePath).toString().split(optionManager().get('buildAndRun', 'caseDelimeter'));

		// Getting Executor
		const srcFile: string = currEditor.document.uri.fsPath, 
			ext: string = popUnsafe(popUnsafe(srcFile.split('\\')).split('.')), 
			executorConstructor: (new(srcFile: string) => Executor) | undefined = executors.get(ext);
		console.log(`Compiling ${srcFile}, extension ${ext}...`);

		if (isUndefined(executorConstructor)) {
			vscode.window.showErrorMessage('File extension not supported yet!');
			return;
		}

        // Compiling and running program
        const executor: Executor = new executorConstructor(srcFile);
        var results: Result[] = [];
        
        executor.preExec();

        if (!isUndefined(executor.resultIfCE)) {
            results.push(executor.resultIfCE);
        }
        else {
            for (const input of inputs) {
                results.push(await interpretReturnBuffer(executor.exec(input)));
            }
            executor.postExec();
        }
		

		console.log(results);

        // Creating HTML result
        const runPanel = vscode.window.createWebviewPanel(
			'buildAndRun',
			'Build and Run',
			vscode.ViewColumn.Active,
			{
				'enableScripts': true
			}
		);

		runPanel.webview.html = getBuildRunHTML({
            srcFile,
            results
		});
    });
    
    context.subscriptions.push(buildRunCommand);
}

function getBuildRunHTML(vars: BuildRunVars) {
	let srcName = vars.srcFile.split('\\').pop();

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <h1>Output of "${srcName}"</h1>
    <p>${JSON.stringify(vars.results)}</p>
</body>
</html>`;
}