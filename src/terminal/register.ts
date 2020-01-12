import * as vscode from 'vscode';
import { extensionTerminalManager } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    // Opens a new instance of the terminal if no terminal is open, otherwise shows any open instance of the terminal
    let openTerminalCommand = vscode.commands.registerCommand('cp-tools.openTerminal', async () => {
        const extensionTerminal = extensionTerminalManager();
        // tslint:disable-next-line: curly
        if (extensionTerminal.isClosed())
            extensionTerminal.open();
        extensionTerminal.show();
        vscode.window.showInformationMessage('Opened Extension Terminal!');
    });
        
    context.subscriptions.push(openTerminalCommand);
}
