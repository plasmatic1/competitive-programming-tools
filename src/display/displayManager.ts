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

let curView: vscode.WebviewPanel | undefined = undefined;
let eventQueue: Event[] = [];
let eventHandlers: Map<EventType, ((arg0: any) => void)[]> = new Map();

/**
 * Opens a new CP Tools webview, or selects it if it's already open.
 * @param context The extension context object
 */
export function openDisplay(context: vscode.ExtensionContext): void {
    if (!isUndefined(curView)) {
        var display: vscode.WebviewPanel = curView;
        display.reveal(vscode.ViewColumn.Active);
    }
    else {
// tslint:disable-next-line: no-duplicate-variable
        var display: vscode.WebviewPanel = vscode.window.createWebviewPanel(
            'cpToolsDisplay',
            'CP Tools',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Attaching Relevant event handlers
        display.onDidDispose(() => {
            curView = undefined;
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
    curView = display;
}

/**
 * Unlinks the current display
 */
export function unlinkDisplay(): void {
    curView = undefined;
}

/**
 * Gets the HTML for the CP Tools display
 * @param context Extension context object
 */
function getDisplayHTML(context: vscode.ExtensionContext) { 
    let resourceDir = vscode.Uri.file(path.join(context.extensionPath, 'out', 'assets')).with({ scheme: 'vscode-resource' });
    // console.log(resourceDir);
    return fs.readFileSync(path.join(context.extensionPath, 'out', 'assets', 'display.html'))
        .toString()
        .replace(/vscodeRoot/g, resourceDir.toString());
}

/**
 * Emits an event to the display
 * @param obj Event object to emit
 */
export function emit(obj: Event) {
    // Has to be like this (likely because of some this shenanigans)
    // This cannot simply be refractored to `const emitEvent = display.webview.postMessage;`
    if (!isUndefined(curView) && curView.visible) {
        curView.webview.postMessage(obj);
    }
    else {
        eventQueue.push(obj);
    }
}

/**
 * Registers an event handler for events from the display
 * @param type Type of event
 * @param handler Event handler
 */
export function register(type: EventType, handler: (arg0: any) => void) {
    let res = eventHandlers.get(type);
    if (isUndefined(res)) {
        eventHandlers.set(type, res = []);
    }

    res.push(handler);
}
