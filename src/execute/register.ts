import * as vscode from 'vscode';
import { programExecutionManager, outputDI, optionManager } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        if (optionManager!.get('buildAndRun', 'curTestSet') === null) {
            vscode.window.showErrorMessage('No test set selected!');
            return;
        }

        outputDI!.openDisplay(context); // Set focus of display
        await programExecutionManager!.haltAll();
        try {
            programExecutionManager!.run();
        } catch(e) { vscode.window.showErrorMessage(e.toString()); }
    });
        
    context.subscriptions.push(buildRunCommand);
}
