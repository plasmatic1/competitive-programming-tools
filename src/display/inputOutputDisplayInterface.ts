import { DisplayInterface, EventType } from './displayInterface';
import { writeWorkspaceFile, readWorkspaceFile } from '../extUtils';
import { CASES_PATH } from '../extension';
import * as vscode from 'vscode';

export enum InputOutputEventTypes {
    ResetCases = 'resetCases', // Removes all cases completely
    SetCases = 'setCases', // Sets the cases
    Ready = 'ready' // The program is ready
}

class Case {
    constructor(
        public input: string = '',
        public output: string | undefined = undefined
    ) {

    }

    reset(): void {
        this.input = '';
        this.output = undefined;
    }
}

export class InputOutputDI {
    curCases: Case[] = [];

    constructor(
        private readonly displayInterface: DisplayInterface
    ) {
        // Handle all case events
        this.displayInterface.on(EventType.InputOutput, (event) => {
            if (event.type === InputOutputEventTypes.ResetCases) {
                this.curCases.length = 0;
                this.saveCases();
            }
            else if (event.type === InputOutputEventTypes.SetCases) {
                this.curCases = event.event;
                this.saveCases();
                vscode.window.showInformationMessage('Saved test cases!');
            }
            // When a ready event (from the webview) is received, retrieve the cases and send it to the webview
            else if (event.type === InputOutputEventTypes.Ready) {
                this.loadCases();
                // console.log(`CurCases: ${JSON.stringify(this.curCases)}`);
                this.displayInterface.emit({
                    type: EventType.InputOutput,
                    event: {
                        type: InputOutputEventTypes.SetCases,
                        event: this.curCases
                    }
                });
            }
        });
    }

    /**
     * Saves the current case object to a file
     */
    saveCases() {
        writeWorkspaceFile(CASES_PATH, JSON.stringify(this.curCases));
    }

    /**
     * Loads current case object from file in .vscode directory
     */
    loadCases() {
        this.curCases = JSON.parse(readWorkspaceFile(CASES_PATH, '[]'));
    }

    // Not really needed for anything at the moment
    // /**
    //  * Emits a buildAndRun event
    //  * @param event The event to emit
    //  */
    // emit(event: any): void {
    //     this.displayInterface.emit(
    //         {
    //             type: EventType.InputOutput,
    //             event
    //         }
    //     );
    // }
}
