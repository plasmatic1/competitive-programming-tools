import { DisplayInterface, EventType } from './displayInterface';

export enum BuildRunEventTypes {
    Init = 'init', // Inbound: Initializes (or Re-initializes the webview).  The following happens: 
    CompileError = 'compileError', // 
    BeginCase = 'beginCase', // Signals 
    EndCase = 'endCase', // Signals
}

// tslint:disable: curly
export class BuildRunDI {
    initResponseQueue: (() => void)[] = [];

    constructor(
        private readonly displayInterface: DisplayInterface
    ) {
        this.displayInterface.on(EventType.BuildAndRun, (evt) => {
            if (evt.type === BuildRunEventTypes.Init) {
                for (let resp of this.initResponseQueue) resp();
                this.initResponseQueue.length = 0;
            }
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

    /**
     * Emits a buildAndRun event
     * @param event The event to emit
     */
    emit(event: any): void {
        this.displayInterface.emit(
            {
                type: EventType.BuildAndRun,
                event
            }
        );
    }
}
