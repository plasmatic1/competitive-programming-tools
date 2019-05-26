// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as options from './options/register';
import { executors, interpretReturnBuffer, Executor, Result } from './executors';
import { OptionManager } from './options/options';
import { errorIfUndefined, popUnsafe } from './undefinedutils';
import { isUndefined } from 'util';

// -----------------------------------------------------------------------------------------------------------------------------
// Globals to export
// -----------------------------------------------------------------------------------------------------------------------------

var _extensionContext: vscode.ExtensionContext | undefined = undefined;
var _optionManager: OptionManager | undefined = undefined;

export function extensionContext(): vscode.ExtensionContext { return errorIfUndefined(_extensionContext, 'Extension not activated!'); }
export function optionManager(): OptionManager { return errorIfUndefined(_optionManager, 'Extension not activated!'); }

// -----------------------------------------------------------------------------------------------------------------------------
// Activation Registration n stuff
// -----------------------------------------------------------------------------------------------------------------------------

interface BuildRunVars {
	srcFile: string;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "cp-tools" is now active!');

	// Setting context
	_extensionContext = context;
	_optionManager = new OptionManager(_extensionContext);

	// Build and Run Command Bodies
	let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
		let currEditor = vscode.window.activeTextEditor;

		if (isUndefined(currEditor)) {
			vscode.window.showErrorMessage('No open file!');
			return;
		}

		const runPanel = vscode.window.createWebviewPanel(
			'buildAndRun',
			'Build and Run',
			vscode.ViewColumn.Active,
			{
				'enableScripts': true
			}
		);

		// Getting input
		var inputs: string[] = [];

		// Compiling and running program
		const srcFile: string = currEditor.document.uri.fsPath, 
			ext: string = popUnsafe(popUnsafe(srcFile.split('\\')).split('.')), 
			executorConstructor: (new(srcFile: string) => Executor) | undefined = executors.get(ext);
		console.log(`Compiling ${srcFile}, extension ${ext}...`);

		if (isUndefined(executorConstructor)) {
			vscode.window.showErrorMessage('Extension not supported yet!');
			return;
		}

		const executor: Executor = new executorConstructor(srcFile);
		executor.preExec();

		var results: Result[] = [];
		for (const input of inputs) {
			results.push(await interpretReturnBuffer(executor.exec(input)));
		}

		executor.postExec();

		console.log(results);

		// Creating HTML result
		runPanel.webview.html = getBuildRunHTML({
			srcFile
		});
	});

	context.subscriptions.push(buildRunCommand);

	// Registering Other Commands
	options.registerViewsAndCommands(context);
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
</body>
</html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}