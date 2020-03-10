import { DisplayInterface, EventType } from './displayInterface';
import { writeWorkspaceFile, readWorkspaceFile } from '../extUtils';
import { testManager } from '../extension';
import * as vscode from 'vscode';

export enum InputOutputEventTypes {
    OpenCaseFile = 'openCaseFile', // Inbound: Opens a case file.  Parameters: key, index, isInput
    CaseCommand = 'caseCommand', // Inbound: A command was run.  Parameters: event is a string | Outbound: Responding to a command.  Parameters: response is a string
    UpdateStructure = 'updateStructure', // Inbound: Request for structure update. | Outbound: Structure update.  Parameters: { key: boolean[] }
    UpdateAll = 'updateAll', // Inbound: Request for everything update. | Outbound: Everything update.  Parameters: { key: Test[] }

    UpdateTestCase = 'updateCase', // Inbound: Updates a test case.  Parameters: key, index, isInput, newData
}

// tslint:disable: curly
export class InputOutputDI {
    constructor(
        private readonly displayInterface: DisplayInterface
    ) {
        // Handle all case events
        this.displayInterface.on(EventType.InputOutput, (event) => {
            if (event.type === InputOutputEventTypes.OpenCaseFile)
                testManager!.openCaseFile(event.key, event.index, event.isInput);
            else if (event.type === InputOutputEventTypes.CaseCommand) {

            }
            else if (event.type === InputOutputEventTypes.UpdateStructure)
                this.updateStructure();
            else if (event.type === InputOutputEventTypes.UpdateAll)
                this.updateAll();
        });
    }

    /**
     * Updates the "structure" of the test sets.  This means everything except for the test data itself
     */
    updateStructure(): void {
        this.emit({
            type: InputOutputEventTypes.UpdateStructure,
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
            type: InputOutputEventTypes.UpdateStructure,
            event: cases
        });
    }

    /**
     * Emits a inputOutput event
     * @param event The event to emit
     */
    emit(event: any): void {
        this.displayInterface.emit(
            {
                type: EventType.InputOutput,
                event
            }
        );
    }
}
