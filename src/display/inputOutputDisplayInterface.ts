import { DisplayInterface, EventType } from './displayInterface';
import { writeWorkspaceFile } from '../extUtils';
import { CASES_PATH } from '../extension';

export enum InputOutputEventTypes {
    ResetCases = 'resetCases', // Removes all cases completely
    SetCases = 'setCases' // Sets the cases
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
            }
        });
    }

    /**
     * Saves the current case object to a file
     */
    saveCases() {
        writeWorkspaceFile(CASES_PATH, JSON.stringify(this.curCases));
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
