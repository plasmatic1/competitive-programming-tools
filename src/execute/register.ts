import * as vscode from 'vscode';
import { programExecutionManager, outputDI } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        outputDI!.openDisplay(context); // Set focus of display
        await programExecutionManager!.haltAll();
        try {
            programExecutionManager!.run();
        } catch(e) { vscode.window.showErrorMessage(e.toString()); }
    });
        
    context.subscriptions.push(buildRunCommand);
}
