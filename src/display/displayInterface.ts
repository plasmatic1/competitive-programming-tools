import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../extUtils';

interface Event {
    type: string;
    event: any;
}

// tslint:disable: curly
export class DisplayInterface {
    public curView: vscode.WebviewPanel | undefined = undefined;
    public eventQueue: Event[] = [];
    public eventHandlers: Map<string, ((arg0: any) => void)[]> = new Map();
    public temporaryEventHandlers: Map<string, ((arg0: any) => void)[]> = new Map();

    private htmlPath: string; // Full path to the HTML document

    /**
     * Initializes a display interface
     * @param _htmlPath The path to the HTML document (for this interface) relative to <extensionPath>/out/assets/entrypoint/
     * @param context The extension context of the extension, needed for resolving context.extensionPath
     */
    constructor(_htmlPath: string, private readonly webviewTitle: string, context: vscode.ExtensionContext) { 
        this.htmlPath = path.join(path.join(context.extensionPath, 'out', 'assets', _htmlPath));
    }

    /**
     * Opens a new CP Tools webview, or selects (focuses) it if it's already open.
     * @param context The extension context object
     */
    openDisplay(context: vscode.ExtensionContext): void {
        if (!isUndefined(this.curView)) {
            var display: vscode.WebviewPanel = this.curView;
            display.reveal(vscode.ViewColumn.Active);
        }
        else {
            // tslint:disable-next-line: no-duplicate-variable
            var display: vscode.WebviewPanel = vscode.window.createWebviewPanel(
                'cpTools',
                this.webviewTitle,
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Attaching Relevant event handlers

            // On dispose
            display.onDidDispose(() => {
                this.curView = undefined;
            }, null, context.subscriptions);

            // Making sure to empty the event queue when the frame is shown
            display.onDidChangeViewState(evt => {
                if (evt.webviewPanel.visible) {
                    // tslint:disable-next-line: curly
                    for (const event of this.eventQueue)
                        display.webview.postMessage(event);
                    this.eventQueue.length = 0;
                }
            });

            // Handling events from the webview
            display.webview.onDidReceiveMessage(evt => {
                // console.log(JSON.stringify(evt));

                if (isUndefined(evt.type)) {
                    vscode.window.showErrorMessage('Received event from webview with unknown type!');
                    return;
                }
                
                // Normal handlers
                let handlers = this.eventHandlers.get(evt.type);
                if (!isUndefined(handlers))
                    handlers.forEach(handle => handle(evt.event));

                // Temp handlers
                let temporaryHandlers = this.temporaryEventHandlers.get(evt.type);
                if (!isUndefined(temporaryHandlers)) {
                    temporaryHandlers.forEach(handle => handle(evt.event));
                    this.temporaryEventHandlers.delete(evt.type);
                }
            });
        }

        // Set final stuff
        display.webview.html = this.getDisplayHTML(context);
        this.curView = display;
    }

    /**
     * Unlinks the current display
     */
    unlinkDisplay(): void {
        this.curView = undefined;
    }

    /**
     * Resets the display HTML of the CP-Tools webview.  Mainly for debugging purposes or if something has gone wrong.
     * If curView is undefined, an error will be thrown
     * @param context The extension context
     */
    resetDisplayHTML(context: vscode.ExtensionContext): void {
        const curView = errorIfUndefined(this.curView, 'No display is loaded!');
        curView.webview.html = this.getDisplayHTML(context);
        vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction').then(() => {
            vscode.window.showInformationMessage('Reloaded WebView HTML!');
        });
    }

    /**
     * Gets the HTML for the CP Tools display
     * @param context Extension context object
     */
    getDisplayHTML(context: vscode.ExtensionContext) { 
        let resourceDir = vscode.Uri.file(path.join(context.extensionPath, 'out', 'assets')).with({ scheme: 'vscode-resource' });
        return fs.readFileSync(this.htmlPath)
            .toString()
            .replace(/vscodeRoot/g, resourceDir.toString());
    }

    /**
     * Emits an event to the display
     * @param obj Event object to emit
     */
    emit(obj: Event) {
        // Has to be like this (likely because of some this shenanigans)
        // This cannot simply be refractored to `const emitEvent = display.webview.postMessage;`
        if (!isUndefined(this.curView) && this.curView.visible) this.curView.webview.postMessage(obj);
        else this.eventQueue.push(obj);
    }

    /**
     * Registers an event handler for events from the display
     * @param type Type of event
     * @param handler Event handler
     */
    on(type: string, handler: (arg0: any) => void) {
        let res = this.eventHandlers.get(type);
        if (isUndefined(res))
            this.eventHandlers.set(type, res = []);
        res.push(handler);
    }
}
