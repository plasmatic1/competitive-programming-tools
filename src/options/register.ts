import * as vscode from 'vscode';
import * as optView from '../options/optionsView';
import { isUndefined } from 'util';
import { optionManager } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    // Registering views
    let optionsNodeProvider = new optView.OptionsNodeProvider();
    vscode.window.registerTreeDataProvider('options', optionsNodeProvider);
    
    // Commands
    let editOptionCommand = vscode.commands.registerCommand('cp-tools.editOption', (option: optView.OptionNode | optView.OptionNodeCategory) => {
        if (option instanceof optView.OptionNode) {
            option.properties.setFunction().then((value) => {	
                if (!isUndefined(value)) {
                    optionManager().set(option.category, option.key, value);
                    optionsNodeProvider.refresh();
                }
            });
        }
    });
    
    let resetOptionsCommand = vscode.commands.registerCommand('cp-tools.resetOptions', () => {
        for (const category of optionManager().categories) {
            for (const [key, properties] of optionManager().entriesFor(category)) {
                optionManager().set(category, key, properties.defaultValue);
            }
        }
        
        optionsNodeProvider.refresh();
    });

    let resetCategoryCommand = vscode.commands.registerCommand('cp-tools.resetCategory', (option: optView.OptionNodeCategory) => {
        for (const [key, properties] of optionManager().entriesFor(option.category)) {
            optionManager().set(option.category, key, properties.defaultValue);
        }
        
        optionsNodeProvider.refresh();
    });
    
    context.subscriptions.push(editOptionCommand);
    context.subscriptions.push(resetOptionsCommand);
    context.subscriptions.push(resetCategoryCommand);
}