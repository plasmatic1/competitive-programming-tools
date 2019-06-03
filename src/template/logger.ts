import * as vscode from 'vscode';
import * as fs from 'fs';
import { join } from 'path';

interface Event {
    type: string;
    text: string;
}

export class Logger {
    private logger: vscode.WebviewPanel;
    private eventQueue: Event[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.logger = vscode.window.createWebviewPanel(
            'templateLog', 
            'Template Log', 
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.logger.webview.html = fs.readFileSync(join(context.extensionPath, 'out', 'template', 'logger.html')).toString();

        this.logger.onDidChangeViewState(evt => {
            if (evt.webviewPanel.visible) {
                for (const evt of this.eventQueue) {
                    this.logger.webview.postMessage(evt);
                }
                this.eventQueue.length = 0;
            }
        });
    }

    async waitForInit() {
        return new Promise((resolve, _) => {
            this.logger.webview.onDidReceiveMessage(evt => {
                if (evt === 'ready') {
                    resolve();
                }
            });
        });
    }

    log(type: string, text: string): void {
        const evt: Event = { type, text };

        if (this.logger.visible) {
            this.logger.webview.postMessage(evt);
        }
        else {
            this.eventQueue.push(evt);
        }
    }

    info(text: string) { this.log('info', text); }
    success(text: string) { this.log('success', text); }
    warning(text: string) { this.log('warning', text); }
    error(text: string) { this.log('error', text); }

    dispose(): void {
        this.logger.dispose();
    }
}