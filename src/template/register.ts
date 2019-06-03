import * as fs from 'fs';
import { join } from 'path';
import { isUndefined } from 'util';
import * as vscode from 'vscode';
import * as parser from './parser';

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

        let templateParser = new parser.TemplateParser();
        templateParser.traverseFolder(pathRes[0].fsPath);
        
        const snippets: any = {};
        for (const [name, body] of templateParser.templates) {
            console.log(`name: ${name}, body: ${body}`);
            snippets[name] = {
                prefix: name,
                body
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