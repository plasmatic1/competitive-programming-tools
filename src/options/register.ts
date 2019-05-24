import * as vscode from 'vscode';
import * as optView from '../options/optionsView';
import { isUndefined } from 'util';
import { optionManager } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    // Registering views
	let optionsNodeProvider = new optView.OptionsNodeProvider();
    vscode.window.registerTreeDataProvider('buildAndRunOptions', optionsNodeProvider);
    
    // Commands
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
    
    context.subscriptions.push(editOptionCommand);
	context.subscriptions.push(resetOptionsCommand);
}