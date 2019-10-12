// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as https from 'https';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as optionsRegister from './options/register';
import * as executeRegister from './execute/register';
import * as templatesRegister from './template/register';
import { join } from 'path';
import { OptionManager } from './options/options';
import { DisplayInterface } from './display/displayInterface';
import { BuildRunDI } from './display/buildRunDisplayInterface';
import { errorIfUndefined } from './extUtils';
import { isUndefined } from 'util';

// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

let _extensionContext: vscode.ExtensionContext | undefined = undefined;
let _optionManager: OptionManager | undefined = undefined;
let _displayInterface: DisplayInterface | undefined = undefined;
let _buildRunDI: BuildRunDI | undefined = undefined;

export function extensionContext(): vscode.ExtensionContext { return errorIfUndefined(_extensionContext, 'Extension not activated!'); }
export function optionManager(): OptionManager { return errorIfUndefined(_optionManager, 'Extension not activated!'); }
export function displayInterface(): DisplayInterface { return errorIfUndefined(_displayInterface, 'Extension not activated!'); }
export function buildRunDI(): BuildRunDI { return errorIfUndefined(_buildRunDI, 'Extension not activated!'); }

export const CASES_PATH = 'cases.json';

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "cp-tools" is now active!');

	// Setting and Initializing Singletons
	_extensionContext = context;
	_optionManager = new OptionManager(_extensionContext);
	_displayInterface = new DisplayInterface();
	_buildRunDI = new BuildRunDI(_displayInterface);

	// Misc. Commands
	let openInputFileCommand = vscode.commands.registerCommand('cp-tools.openInputFile', () => {
		const path = optionManager().get('buildAndRun', 'inputFile');
		
		if (!fs.existsSync(path)) {
			vscode.window.showErrorMessage(`Could not find input file ${path}!`);
			return;
		}

		vscode.commands.executeCommand('vscode.open', vscode.Uri.file(path));
	});

	let cacheVueCommand = vscode.commands.registerCommand('cp-tools.cacheVue', () => {
		if (isUndefined(context.storagePath)) {
			vscode.window.showErrorMessage('VSCode is currently not open to a folder!');
			return;
		}

		vscode.window.showInformationMessage('Fetching vue.min.js...');

		VUE_PATH = join(context.extensionPath, '.vscode', VUE_NAME);

		https.get(VUE_URL, function(resp) {
			vscode.window.showInformationMessage('Received response...');
			let data = '';

			resp.on('data', chunk => data += chunk );

			resp.on('end', () => {
				console.log(VUE_PATH);
				fs.writeFileSync(VUE_PATH, data);
				vscode.window.showInformationMessage(`Success! Saved vue.min.js to ${VUE_PATH}`);
			});
		}).on('error', (err: Error) => {
			vscode.window.showErrorMessage(`Error while fetching vue.min.js: ${err.message}`);
		});
	});

	let uncacheVueCommand = vscode.commands.registerCommand('cp-tools.uncacheVue', () => {
		if (isUndefined(context.storagePath)) {
			vscode.window.showErrorMessage('VSCode is currently not open to a folder!');
			return;
		}

		if (!fs.existsSync(VUE_PATH)) {
			vscode.window.showErrorMessage(`Vue.js not currently cached! (Current path for local Vue.js copy is ${VUE_PATH})`);
			return;
		}

		fs.unlinkSync(VUE_PATH);
		vscode.window.showInformationMessage('Success! Deleted local copy of Vue.js!');
	});

	context.subscriptions.push(openInputFileCommand);
	context.subscriptions.push(cacheVueCommand);
	context.subscriptions.push(uncacheVueCommand);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}