import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { isUndefined } from 'util';

export enum EventType {
    BuildAndRun = 'buildAndRun',
    InputOutput = 'inputOutput',
    Tools = 'tools',
    Settings = 'settings'
}

interface Event {
    type: string;
    event: any;
}

let lastView: vscode.WebviewPanel | undefined = undefined;
let eventQueue: Event[] = [];
let eventHandlers: Map<EventType, ((arg0: any) => void)[]> = new Map();

export function getWebview(context: vscode.ExtensionContext): vscode.WebviewPanel {
    if (!isUndefined(lastView)) {
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

        // Attaching Relevant event handlers
        display.onDidDispose(() => {
            lastView = undefined;
        }, null, context.subscriptions);

        display.onDidChangeViewState(evt => {
            if (evt.webviewPanel.visible) {
                while (eventQueue.length) {
                    display.webview.postMessage(eventQueue.shift());
                }
            }
        });

        display.webview.onDidReceiveMessage(evt => {
            console.log(JSON.stringify(evt));

            if (isUndefined(evt.type)) {
                vscode.window.showErrorMessage('Received event from webview with unknown type!');
                return;
            }

            let handlers = eventHandlers.get(evt.type);
            if (!isUndefined(handlers)) {
                handlers.forEach(handle => handle(evt.event));
            }
        });
    }

    // Set final stuff
    display.webview.html = getDisplayHTML(context);
    lastView = display;

    return display;
}

export function unlinkWebview(): void {
    lastView = undefined;
}

function getDisplayHTML(context: vscode.ExtensionContext) { 
    let resourceDir = vscode.Uri.file(path.join(context.extensionPath, 'out', 'assets')).with({ scheme: 'vscode-resource' });
    // console.log(resourceDir);
    return fs.readFileSync(path.join(context.extensionPath, 'out', 'assets', 'display.html'))
        .toString()
        .replace(/vscodeRoot/g, resourceDir.toString());
}

// Event handling
export function emit(obj: Event) {
    // Has to be like this (likely because of some this shenanigans)
    // This cannot simply be refractored to `const emitEvent = display.webview.postMessage;`
    if (!isUndefined(lastView) && lastView.visible) {
        lastView.webview.postMessage(obj);
    }
    else {
        eventQueue.push(obj);
    }
}

export function register(type: EventType, handler: (arg0: any) => void) {
    let res = eventHandlers.get(type);
    if (isUndefined(res)) {
        eventHandlers.set(type, res = []);
    }

    res.push(handler);
}
