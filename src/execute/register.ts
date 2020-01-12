import * as vscode from 'vscode';
import { programExecutionManager, displayInterface } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        displayInterface().openDisplay(context); // Set focus of display
        displayInterface().focusTab('Build and Run'); // Set focus of tab
        programExecutionManager().halt();
        programExecutionManager().run();
    });
        
    context.subscriptions.push(buildRunCommand);
}
