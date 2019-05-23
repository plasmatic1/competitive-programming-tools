// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface BuildRunVars {
	srcFile: String;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "cp-tools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', () => {
		// The code you place here will be executed every time your command is executed

		let currEditor = vscode.window.activeTextEditor;

		if (currEditor === undefined) {
			vscode.window.showErrorMessage('No open file!');
			return;
		}

		const runPanel = vscode.window.createWebviewPanel(
			'buildAndRun',
			'Build and Run',
			vscode.ViewColumn.Active,
			{
				"enableScripts": true
			}
		);

		runPanel.webview.html = getBuildRunHTML({
			srcFile: currEditor.document.uri.fsPath
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
</body>
</html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
