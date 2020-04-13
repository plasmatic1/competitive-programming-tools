import * as vscode from 'vscode';
import * as fs from 'fs';
import { getTempFile, showFile } from '../extUtils';
import { programExecutionManager, log } from '../extension';
import { DisplayInterface } from './displayInterface';
import { Result, SkippedResult } from '../execute/execute';
import { isUndefined } from 'util';

// tslint:disable: curly
export enum EventType {
    Update = 'update', // Outbound: Update case info
    SaveCases = 'saveCases', // Inbound: Save edited cases from output panel (file name, cases)

    ViewAll = 'viewAll', // Inbound: View the info of all test cases as a file.  Parameters: None
    View = 'view', // Inbound: View the info of one test case as a file.  Parameters: Event will be an integer, the integer is the index of the case to view
    Compare = 'compare', // Inbound: Compare the actual and expected output of a case.  Parameters: Event will be an integer, the integer is the index of the case to view
    KillAll = 'killAll', // Inbound: Kill (halt) all test cases
    Kill = 'kill', // Inbound: Kill current test case
}

/**
 * Writes the result of a execution (as text) to a write stream (formatted).
 * @param writer The write stream to write to
 * @param result The execution result to write
 */
function writeResult(writer: fs.WriteStream, result: Result | SkippedResult): void {
    writer.write(`== Case ${result.caseId}: ${result.verdict} =====\n`);
    if (result instanceof Result) {
        writer.write(`Time: ${result.time}ms\n`);
        writer.write(`Memory: ${result.memory}kb\n`);
        writer.write(result.exitStatus + '\n');
        writer.write('\n');

        writer.write('- Input ---\n');
        writer.write(result.stdin + '\n');
        writer.write('- Actual Output ---\n');
        writer.write(result.stdout + '\n');
        writer.write('- Expected Output ---\n');
        writer.write((result.expectedStdout === undefined ? '\n' : result.expectedStdout) + '\n');
        writer.write('- Error Stream ---\n');
        writer.write(result.stderr + '\n');
    } else writer.write('\n');
}

/**
 * Writes the given compile errors (as text) to a write stream (formatted).
 * @param writer The write stream to write to
 * @param compileErrors The compile errors to write
 */
function writeCompileErrors(writer: fs.WriteStream, compileErrors: string[]) {
    if (compileErrors.length > 0) {
        writer.write('\n' + '== Compile/Data Errors =====\n');
        writer.write(compileErrors.join('\n\n') + '\n\n');
    }
}

export class OutputDI extends DisplayInterface {
    initResponseQueue: (() => void)[] = [];

    constructor(context: vscode.ExtensionContext) {
        super('output.html', 'Execution Output', context);

        // Event Handlers
        this.on(EventType.ViewAll, () => {
            const res = programExecutionManager?.curExecution;
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }
            const srcName = res.srcName.replace(/\\/g, '/').split('/').pop(), path = getTempFile(`execution-${res.executionId}-${srcName}`);
            let writer = fs.createWriteStream(path);

            writer.write(`-=[ Output of ${srcName} ]=-\n`);
            writer.write(`Execution ID: ${res.executionId}\n\n`);
            writeCompileErrors(writer, res.compileErrors);
            for (const result of res.results) writeResult(writer, result);
            writer.close();

            showFile(path);
        });
        this.on(EventType.View, index => {
            const res = programExecutionManager?.curExecution, testCase = res?.results[index];
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }
            const srcName = res.srcName.replace(/\\/g, '/').split('/').pop(), path = getTempFile(`execution-${res.executionId}-${srcName}`);
            let writer = fs.createWriteStream(path);

            writer.write(`-=[ Output of case ${index} of ${srcName} ]=-\n`);
            writer.write(`Execution ID: ${res.executionId}\n\n`);
            writeCompileErrors(writer, res.compileErrors);
            writeResult(writer, testCase!);
            writer.close();

            showFile(path);
        });
        this.on(EventType.Compare, index => {
            const res = programExecutionManager?.curExecution, testCase = res?.results[index];
            if (isUndefined(res)) {
                vscode.window.showErrorMessage('No previous result present to view! (Is this an error?)');
                return;
            }

            if (testCase instanceof Result) {
                const srcName = res.srcName.replace(/\\/g, '/').split('/').pop(),
                    pathActual = getTempFile(`actual-out-${res.executionId}-${srcName}`),
                    pathExpected = getTempFile(`expected-out-${res.executionId}-${srcName}`);
                fs.writeFileSync(pathActual, testCase.stdout);
                fs.writeFileSync(pathExpected, testCase.expectedStdout);
                vscode.commands.executeCommand('vscode.diff', vscode.Uri.file(pathActual), vscode.Uri.file(pathExpected), "Actual vs Expected Output");
            } else vscode.window.showErrorMessage('Can\'t compare skipped result!');
        });
        this.on(EventType.KillAll, () => programExecutionManager!.haltAll());
        this.on(EventType.Kill, () => programExecutionManager!.haltCurrentCase());

        // Save case
        this.on(EventType.SaveCases, evt => {
            const { path, cases } = evt;
            // TODO: Implement
            log!.info(`Saved cases to ${path}`);
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
