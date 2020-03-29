import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as executeRegister from './execute/register';
import * as templatesRegister from './template/register';
import * as optionsRegister from './options/register';
import { OptionManager } from './options/options';
import { TestManager } from './execute/tests';
import { OutputDI } from './display/outputDisplayInterface';
import { ProgramExecutionManager } from './execute/execute';
import { InputDI } from './display/inputDisplayInterface';
import { OptionsDI } from './display/optionsDisplayInterface';
import { rootPath } from './extUtils';
import { Bridge } from './companionBridge';
import { Logger } from './logger';

// tslint:disable: curly
// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

export let extensionContext: vscode.ExtensionContext | undefined = undefined;
export let optionManager: OptionManager | undefined = undefined;
export let testManager: TestManager | undefined = undefined;

export let outputDI: OutputDI | undefined = undefined;
export let inputDI: InputDI | undefined = undefined;
export let optionsDI: OptionsDI | undefined = undefined;

export let programExecutionManager: ProgramExecutionManager | undefined = undefined;

// Test manager refresh loop
let testManagerRefreshTimer: undefined | NodeJS.Timer = undefined;

// Output channel
export let log: Logger | undefined = undefined;

// Bridge
let bridge: Bridge | undefined = undefined;

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

// tslint:disable: curly
export function activate(context: vscode.ExtensionContext) {
	// Setting and Initializing Singletons
	extensionContext = context;
	optionManager = new OptionManager(extensionContext);
	testManager = new TestManager(); testManager.readFromConfig();

	outputDI = new OutputDI(context);
	inputDI = new InputDI(context);
	optionsDI = new OptionsDI(context);

	programExecutionManager = new ProgramExecutionManager();

	// Misc. Commands
	let openInput = vscode.commands.registerCommand('cp-tools.openInput', () => inputDI?.openDisplay(context));
	let openOutput = vscode.commands.registerCommand('cp-tools.openOutput', () => outputDI?.openDisplay(context));
	let openOptions = vscode.commands.registerCommand('cp-tools.openOptions', () => optionsDI?.openDisplay(context));
	let removeTemp = vscode.commands.registerCommand('cp-tools.removeTempFiles', () => {
		for (const file of fs.readdirSync(rootPath())) {
			if (file.startsWith('tmp'))
				fs.unlinkSync(path.join(rootPath(), file));
		}
		vscode.window.showInformationMessage('Removed temporary files!');
	});

	context.subscriptions.push(openInput);
	context.subscriptions.push(openOutput);
	context.subscriptions.push(openOptions);
	context.subscriptions.push(removeTemp);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);

	// Test manager refresh loop
	testManagerRefreshTimer = setInterval(() => testManager!.writeToConfig(), optionManager!.get('misc', 'testSetBackupTime'));

	// Output channel
	log = new Logger('Competitive Programming Tools');
	log.show();

	// Bridge
	// Ref: https://github.com/jmerle/competitive-companion#the-format
	bridge = new Bridge(problem => {
		let setName = problem.name.toLowerCase().replace(/\s/g, '-').replace(/[^\w-]/g, '');
		testManager!.addSet(setName);

		let ind = 0;
		for (let { input, output } of problem.tests) {
			testManager!.pushCase(setName);
			fs.writeFileSync(testManager!.caseFilePath(setName, ind, true), input);
			fs.writeFileSync(testManager!.caseFilePath(setName, ind, false), output);

			ind++;
		}

		inputDI!.updateAll();
	});

	console.log('Initialized extension "cp-tools"');
}

// cleanup
export function deactivate() {
	// Test set manager
	if (testManagerRefreshTimer !== undefined) clearInterval(testManagerRefreshTimer);
	testManager?.writeToConfig();
}
