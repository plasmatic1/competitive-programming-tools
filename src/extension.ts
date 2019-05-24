// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as optView from './optionsView';
import { OptionManager } from './options';
import { errorIfUndefined } from './undefinedutils';
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

	// Registering views
	let optionsNodeProvider = new optView.OptionsNodeProvider()
	vscode.window.registerTreeDataProvider('buildAndRunOptions', optionsNodeProvider);

	// Command Bodies
	let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', () => {
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

		runPanel.webview.html = getBuildRunHTML({
			srcFile: currEditor.document.uri.fsPath
		});
	});

	let editOptionCommand = vscode.commands.registerCommand('cp-tools.editOption', (option: optView.OptionNode) => {
		option.properties.setFunction().then((value) => {	
			if (!isUndefined(value)) {
				optionManager().set(option.key, value);
				optionsNodeProvider.refresh();
			}
		});
	});

	let resetOptionsCommand = vscode.commands.registerCommand('cp-tools.resetOptions', () => {
		for (const [key, properties] of optionManager().entries) {
			optionManager().set(key, properties.defaultValue);
		}
		optionsNodeProvider.refresh();
	});

	// Registering Commands
	context.subscriptions.push(buildRunCommand);
	context.subscriptions.push(editOptionCommand);
	context.subscriptions.push(resetOptionsCommand);
	
	// Setting context
	_extensionContext = context;
	_optionManager = new OptionManager(_extensionContext);
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