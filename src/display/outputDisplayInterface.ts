import * as vscode from 'vscode';
import * as fs from 'fs';
import { getTempFile } from '../extUtils';
import { programExecutionManager } from '../extension';
import { DisplayInterface } from './displayInterface';
import { Result } from '../execute/execute';
import { isUndefined } from 'util';

export enum EventType {
    Init = 'init', // Inbound/Outbound: Initializes (or Re-initializes the webview) with the specified number of cases.  Parameters: caseCount
    CompileError = 'compileError', // Outbound: There is a compile error.  Parameters: Same as execute.execute.CompileError
    BeginCase = 'beginCase', // Outbound: A case is starting to be judged.  Parameters: executionId, caseno
    EndCase = 'endCase', // Outbound: A case is done.  Parameters: Same as execute.execute.Result

    ViewAll = 'viewAll', // Inbound: View the info of all test cases as a file.  Parameters: None
    View = 'view', // Inbound: View the info of one test case as a file.  Parameters: Event will be an integer, the integer is the index of the case to view
    Compare = 'compare', // Inbound: Compare the actual and expected output of a case.  Parameters: Event will be an integer, the integer is the index of the case to view
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
        this.on(EventType.ViewAll, () => {
            const res = programExecutionManager?.previousExecution;
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }
            let writer = fs.createWriteStream(getTempFile(`execution-${res.srcName}-${res.executionId}`));
            // TODO: Implement handler
            writer.close();
        });
        this.on(EventType.View, index => {
            const res = programExecutionManager?.previousExecution, testCase = res?.results[index];
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }
            let writer = fs.createWriteStream(getTempFile(`execution-${res.srcName}-${res.executionId}`));
            // TODO: Implement handler
            writer.close();
        });
        this.on(EventType.Compare, index => {
            const res = programExecutionManager?.previousExecution, testCase = res?.results[index];
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }

            if (testCase instanceof Result) {
                const srcName = res.srcName.replace(/\\/g, '/').split('/').pop(),
                    pathActual = getTempFile(`actual-out-${srcName}-${res.executionId}`),
                    pathExpected = getTempFile(`expected-out-${srcName}-${res.executionId}`);
                fs.writeFileSync(pathActual, testCase.stdout);
                fs.writeFileSync(pathExpected, testCase.expectedStdout);
                vscode.commands.executeCommand('vscode.diff', vscode.Uri.file(pathActual), vscode.Uri.file(pathExpected), "Actual vs Expected Output");
            } else vscode.window.showErrorMessage('Can\'t compare skipped result!');
        });
        this.on(EventType.KillAll, () => programExecutionManager!.haltAll());
        this.on(EventType.Kill, () => programExecutionManager!.haltCurrentCase());
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
