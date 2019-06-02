import * as vscode from 'vscode';
import * as optView from '../options/optionsView';
import { isUndefined } from 'util';
import { optionManager } from '../extension';
import { OptionProperties } from './options';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    // Registering views
    let optionsNodeProvider = new optView.OptionsNodeProvider();
    vscode.window.registerTreeDataProvider('options', optionsNodeProvider);
    
    // Commands
    let editOptionCommand = vscode.commands.registerCommand('cp-tools.editOption', async (option: optView.OptionNode) => {
        if (isUndefined(option)) {
            const selected = await vscode.window.showQuickPick(
                optionManager().categories
                    .map(category => optionManager().entriesFor(category)
                        .map(([key, _]) => `${category}.${key}: ${optionManager().get(category, key)}`))
                    .reduce((last, cur) => last.concat(cur), []),
                { canPickMany: false }
            );

            if (isUndefined(selected)) {
                return;
            }

            var [category, key] = selected.split(': ')[0].split('.');
            var properties: OptionProperties = optionManager().optionProperties(category, key);
        }
        else {
// tslint:disable-next-line: no-duplicate-variable
            var properties: OptionProperties = option.properties, category = option.category, key = option.key;
        }

        properties.setFunction().then((value) => {	
            if (!isUndefined(value)) {
                optionManager().set(category, key, value);
                optionsNodeProvider.refresh();
            }
        });
    });
    
    let resetOptionsCommand = vscode.commands.registerCommand('cp-tools.resetOptions', () => {
        for (const category of optionManager().categories) {
            for (const [key, properties] of optionManager().entriesFor(category)) {
                optionManager().set(category, key, properties.defaultValue);
            }
        }
        
        optionsNodeProvider.refresh();
    });

    let resetCategoryCommand = vscode.commands.registerCommand('cp-tools.resetCategory', async (option: optView.OptionNodeCategory) => {
        if (isUndefined(option)) {
            const selected = await vscode.window.showQuickPick(optionManager().categories, { canPickMany: false });
            
            if (isUndefined(selected)) {
                return;
            }
            var category = selected;
        }
        else {
// tslint:disable-next-line: no-duplicate-variable
            var category = option.category;
        }

        for (const [key, properties] of optionManager().entriesFor(category)) {
            optionManager().set(category, key, properties.defaultValue);
        }
        
        optionsNodeProvider.refresh();
    });
    
    context.subscriptions.push(editOptionCommand);
    context.subscriptions.push(resetOptionsCommand);
    context.subscriptions.push(resetCategoryCommand);
}