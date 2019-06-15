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
import { errorIfUndefined } from './undefinedutils';
import { isUndefined } from 'util';

// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

var _extensionContext: vscode.ExtensionContext | undefined = undefined;
var _optionManager: OptionManager | undefined = undefined;

export function extensionContext(): vscode.ExtensionContext { return errorIfUndefined(_extensionContext, 'Extension not activated!'); }
export function optionManager(): OptionManager { return errorIfUndefined(_optionManager, 'Extension not activated!'); }

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

const VUE_URL: string = 'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.min.js';
const VUE_NAME: string = 'vue.min.js';
export let VUE_PATH: string = 'path not set yet';

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