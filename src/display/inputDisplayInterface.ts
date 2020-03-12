import { DisplayInterface } from './displayInterface';
import { testManager } from '../extension';
import * as fs from 'fs';
import * as vscode from 'vscode';

export enum EventType {
    OpenCaseFile = 'openCaseFile', // Inbound: Opens a case file.  Parameters: key, index, isInput
    CaseCommand = 'caseCommand', // Inbound: A command was run.  Parameters: event is a string | Outbound: Responding to a command.  Parameters: response is a string
    UpdateStructure = 'updateStructure', // Inbound: Request for structure update. | Outbound: Structure update.  Parameters: { key: boolean[] }
    UpdateAll = 'updateAll', // Inbound: Request for everything update. | Outbound: Everything update.  Parameters: { key: Test[] }
    UpdateTestCase = 'updateCase', // Inbound: Updates a test case.  Parameters: key, index, isInput, newData
}

// tslint:disable: curly
export class InputDI extends DisplayInterface {
    constructor(context: vscode.ExtensionContext) {
        // Handle all case events
        super('input.html', 'Test Cases', context);
        this.on(EventType.OpenCaseFile, evt => testManager!.openCaseFile(evt.key, evt.index, evt.isInput));
        this.on(EventType.CaseCommand, evt => { 
            // TODO: Implement handler
        });
        this.on(EventType.UpdateStructure, _ => this.updateStructure());
        this.on(EventType.UpdateAll, _ => this.updateAll());
        this.on(EventType.UpdateTestCase, evt => {
            fs.writeFileSync(testManager!.caseFilePath(evt.key, evt.index, evt.isInput), evt.newData);
            vscode.window.showInformationMessage(`Saved case data to test set ${evt.key}, case #${evt.index}`);
            this.emit({
                type: EventType.UpdateTestCase,
                event: evt
            });
        });
    }

    /**
     * Updates the "structure" of the test sets.  This means everything except for the test data itself
     */
    updateStructure(): void {
        this.emit({
            type: EventType.UpdateStructure,
            event: testManager!.getCaseStructure()
        });
    }

    /**
     * Updates everything.
     */
    updateAll(): void {
        let cases: any = {};
        for (const [key, val] of testManager!.testSets.entries())
            cases[key] = val.map((disabled, index) => {
                return {
                    index,
                    disabled,
                    input: testManager!.getInput(key, index),
                    output: testManager!.getOutput(key, index)
                };
            });
        this.emit({
            type: EventType.UpdateAll,
            event: cases
        });
    }
}
