import * as vscode from 'vscode';
import { optionManager } from './extension';
import { isUndefined } from 'util';

let lastView: vscode.WebviewPanel | undefined = undefined;

export function getWebview(context: vscode.ExtensionContext): vscode.WebviewPanel {
    if (optionManager().get('buildAndRun', 'reuseWebviews') && !isUndefined(lastView)) {
        var display: vscode.WebviewPanel = lastView;
        display.reveal(vscode.ViewColumn.Active);
    }
    else {
// tslint:disable-next-line: no-duplicate-variable
        var display: vscode.WebviewPanel = vscode.window.createWebviewPanel(
            'buildAndRun',
            'Build and Run',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        display.onDidDispose(() => {
            lastView = undefined;
        }, null, context.subscriptions);
    }

    lastView = display;
    return display;
}

export function unlinkWebview(): void {
    lastView = undefined;
}