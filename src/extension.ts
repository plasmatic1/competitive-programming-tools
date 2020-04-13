import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as executeRegister from './execute/register';
import * as templatesRegister from './template/register';
import { OutputDI } from './display/outputDisplayInterface';
import { ProgramExecutionManager } from './execute/execute';
import { InputDI } from './display/inputDisplayInterface';
import { rootPath, workspaceFilePath } from './extUtils';
import { Bridge } from './companionBridge';
import { Logger } from './logger';
import { writeSet, TestSet } from './execute/tests';

// tslint:disable: curly
// ---------------------------------------------------------------------------
// Globals to export
// ---------------------------------------------------------------------------

export let extensionContext: vscode.ExtensionContext | undefined = undefined;

export let outputDI: OutputDI | undefined = undefined;
export let inputDI: InputDI | undefined = undefined;

export let programExecutionManager: ProgramExecutionManager | undefined = undefined;

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

	outputDI = new OutputDI(context);
	inputDI = new InputDI(context);

	programExecutionManager = new ProgramExecutionManager();

	// Misc. Commands
	let openInput = vscode.commands.registerCommand('cp-tools.openInput', () => inputDI?.openDisplay(context));
	let openOutput = vscode.commands.registerCommand('cp-tools.openOutput', () => outputDI?.openDisplay(context));
	let removeTemp = vscode.commands.registerCommand('cp-tools.removeTempFiles', () => {
		for (const file of fs.readdirSync(rootPath())) {
			if (file.startsWith('tmp'))
				fs.unlinkSync(path.join(rootPath(), file));
		}
		vscode.window.showInformationMessage('Removed temporary files!');
	});

	context.subscriptions.push(openInput);
	context.subscriptions.push(openOutput);
	context.subscriptions.push(removeTemp);

	// Registering Other Commands
	executeRegister.registerViewsAndCommands(context);
	templatesRegister.registerViewsAndCommands(context);

	// Output channel
	log = new Logger('Competitive Programming Tools');
	log.show();

	// Bridge
	// Ref: https://github.com/jmerle/competitive-companion#the-format
	bridge = new Bridge(problem => {
		let setName = problem.name.toLowerCase() + ' data',
			set: TestSet = {
				checker: vscode.workspace.getConfiguration('cptools.build').get<string>('defaultChecker')!,
				tests: problem.tests.map(({ input, output }: { input: string, output: string }, idx: any) => { return { input, output, index: idx }; }),
				disabled: new Array(problem.tests.length).fill(false)
			};
		writeSet(workspaceFilePath(setName), set);
		log?.info(`Parsed samples for ${problem.name} from Competitive Companion!`);
	});

	console.log('Initialized extension "cp-tools"');
}

// cleanup
export function deactivate() {
}
