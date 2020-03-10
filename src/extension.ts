import * as vscode from 'vscode';
import * as executeRegister from './execute/register';
import * as templatesRegister from './template/register';
import * as optionsRegister from './options/register';
import { OptionManager } from './options/options';
import { TestManager } from './execute/tests';
import { DisplayInterface } from './display/displayInterface';
import { BuildRunDI } from './display/buildRunDisplayInterface';
import { ProgramExecutionManagerDriver } from './execute/execute';
import { InputOutputDI } from './display/inputOutputDisplayInterface';
import { OptionsDI } from './display/optionsDisplayInterface';

// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

export let extensionContext: vscode.ExtensionContext | undefined = undefined;
export let optionManager: OptionManager | undefined = undefined;
export let testManager: TestManager | undefined = undefined;

export let displayInterface: DisplayInterface | undefined = undefined;
export let buildRunDI: BuildRunDI | undefined = undefined;
export let inputOutputDI: InputOutputDI | undefined = undefined;
export let optionsDI: OptionsDI | undefined = undefined;

export let programExecutionManager: ProgramExecutionManagerDriver | undefined = undefined;

// ---------------------------------------------------------------------------
// Activation Registration n stuff
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
	console.log('Initialized extension "cp-tools"');

	// Setting and Initializing Singletons
	extensionContext = context;
	optionManager = new OptionManager(extensionContext);
	testManager = new TestManager(); testManager.readFromConfig();

	displayInterface = new DisplayInterface();
	buildRunDI = new BuildRunDI(displayInterface);
	inputOutputDI = new InputOutputDI(displayInterface);
	optionsDI = new OptionsDI(displayInterface, optionManager);

	programExecutionManager = new ProgramExecutionManagerDriver(buildRunDI);

	// Misc. Commands
	let resetDisplayHTML = vscode.commands.registerCommand('cp-tools.resetDisplayHTML', () => {
		displayInterface?.resetDisplayHTML(context);
	});
	let open = vscode.commands.registerCommand('cp-tools.open', () => {
		displayInterface?.openDisplay(context);
	});

	context.subscriptions.push(resetDisplayHTML);
	context.subscriptions.push(open);

	// Registering Other Commands
	optionsRegister.registerViewsAndCommands(context);
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);
}

// cleanup
export function deactivate() {
	testManager!.writeToConfig();
}
