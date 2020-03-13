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

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

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

	context.subscriptions.push(openInput);
	context.subscriptions.push(openOutput);
	context.subscriptions.push(openOptions);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);

	console.log('Initialized extension "cp-tools"');
}

// cleanup
export function deactivate() {
	testManager!.writeToConfig();
}
