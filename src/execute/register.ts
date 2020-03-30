import * as vscode from 'vscode';
import { programExecutionManager, outputDI } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        if (vscode.workspace.getConfiguration('cptools.build').get<string>('curTestSet') === undefined) {
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
