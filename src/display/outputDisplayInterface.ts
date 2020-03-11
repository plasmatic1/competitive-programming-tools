import * as vscode from 'vscode';
import { DisplayInterface } from './displayInterface';

export enum EventType {
    Init = 'init', // Inbound/Outbound: Initializes (or Re-initializes the webview) with the specified number of cases.  Parameters: caseCount
    CompileError = 'compileError', // Outbound: There is a compile error.  Parameters: Same as execute.execute.CompileError
    BeginCase = 'beginCase', // Outbound: A case is starting to be judged.  Parameters: executionId, caseno
    EndCase = 'endCase', // Outbound: A case is done.  Parameters: Same as execute.execute.Result

    ViewAll = 'viewAll', // Inbound: View the info of all test cases as a file.  Parameters: None
    View = 'view', // Inbound: View the info of one test case as a file.  Parameters: Event will be an integer, the integer is the index of the case to view
    KillAll = 'killAll', // Inbound: Kill (halt) all test cases
    Kill = 'kill', // Inbound: Kill current test case
}

// tslint:disable: curly
export class OutputDI extends DisplayInterface {
    initResponseQueue: (() => void)[] = [];

    constructor(context: vscode.ExtensionContext) {
        super('output.html', 'Execution Output', context);
        this.on(EventType.Init, _ => {
            for (let resp of this.initResponseQueue) resp();
            this.initResponseQueue.length = 0;
        });
    }

    /**
     * When the init event is sent to the webview, the webview should respond back with a init event to confirm that the init was complete.
     */
    async waitForInitResponse(): Promise<void> {
        return new Promise((res, _) => { // Lambda so `this` is not overridden
            this.initResponseQueue.push(res);
        });
    }
}
