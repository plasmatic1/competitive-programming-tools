import * as vscode from 'vscode';
import { programExecutionManager, outputDI, optionManager } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        if (optionManager!.get('buildAndRun', 'curTestSet') === null) {
            vscode.window.showErrorMessage('No test set selected!');
            return;
        }

        await programExecutionManager!.haltAll();
        outputDI!.openDisplay(context); // Set focus of display
        try {
            programExecutionManager!.run();
        } catch(e) { vscode.window.showErrorMessage(e.toString()); }
    });
        
    context.subscriptions.push(buildRunCommand);
}
