import * as vscode from 'vscode';
import { programExecutionManager, outputDI } from '../extension';

export function registerViewsAndCommands(context: vscode.ExtensionContext): void {
    let buildRunCommand = vscode.commands.registerCommand('cp-tools.buildAndRun', async () => {
        outputDI!.openDisplay(context); // Set focus of display
        await programExecutionManager!.haltAll();
        programExecutionManager!.run();
    });
        
    context.subscriptions.push(buildRunCommand);
}
