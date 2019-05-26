// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as optionsRegister from './options/register';
import * as executeRegister from './execute/register';
import { OptionManager } from './options/options';
import { errorIfUndefined } from './undefinedutils';

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

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "cp-tools" is now active!');

	// Setting context
	_extensionContext = context;
	_optionManager = new OptionManager(_extensionContext);

	// Misc. Commands
	let openInputFileCommand = vscode.commands.registerCommand('cp-tools.openInputFile', () => {
		const path = optionManager().get('buildAndRun', 'inputFile');
		
		if (!fs.existsSync(path)) {
			vscode.window.showErrorMessage(`Could not find input file ${path}!`);
			return;
		}

		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(path));
	});

	context.subscriptions.push(openInputFileCommand);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}