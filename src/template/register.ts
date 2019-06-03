import * as fs from 'fs';
import { join } from 'path';
import { isUndefined } from 'util';
import * as vscode from 'vscode';
import * as parser from './parser';
import { errorIfUndefined } from '../undefinedutils';

const SNIPPETS_FILE = 'snippets.code-snippets';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    // Commands
    let loadTemplatesCommand = vscode.commands.registerCommand('cp-tools.loadTemplates', async () => {
        if (isUndefined(vscode.workspace.rootPath)) {
            vscode.window.showErrorMessage('No folder open!');
            return;
        }

        const pathRes: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectMany: false
        });

        if (isUndefined(pathRes)) {
            vscode.window.showErrorMessage('No folder selected!');
            return;
        }

        let templateParser = new parser.TemplateParser(context);
        templateParser.parseConfig(pathRes[0].fsPath);
        templateParser.traverseFolder(pathRes[0].fsPath);
        
        const snippets: any = {};
        for (let [name, template] of templateParser.templates) {
            // console.log(`name: ${name}, body: ${body}`);
            if (errorIfUndefined(templateParser.options).replaceBackslashes) {
                templateParser.info(`Replacing backslashes of name '${name}' with slashes!`);
                name = name.replace(/\\/g, '/');
            }

            snippets[name] = {
                prefix: name,
                description: template.description,
                body: template.lines
            };
        }

        fs.writeFileSync(join(vscode.workspace.rootPath, '.vscode', SNIPPETS_FILE), JSON.stringify(snippets));
        vscode.window.showInformationMessage('Loaded snippets!');
        // templateParser.closeLogger();
    });
    
    let packTemplatesCommand = vscode.commands.registerCommand('cp-tools.packTemplates', async () => {
        
    });

    let unpackTemplatesCommand = vscode.commands.registerCommand('cp-tools.unpackTemplates', async () => {
        
    });
    
    context.subscriptions.push(loadTemplatesCommand);
    context.subscriptions.push(packTemplatesCommand);
    context.subscriptions.push(unpackTemplatesCommand);
}