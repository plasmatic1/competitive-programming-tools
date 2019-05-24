import * as vscode from 'vscode';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../undefinedutils';

export interface OptionProperties {
    defaultValue: string | number | undefined; // Default value for this option
    label: string; // Label for this option
    description: string; // Description for this option
    type: string; // Type of this option
    setFunction: () => Thenable<string | number | undefined>; // Function called to set this option.  Return `undefined` if the set attempt failed
}

const OPTIONS: Map<string, OptionProperties> = new Map([
    ['inputFile', {
        defaultValue: 'input.txt',
        label: 'Input File',
        description: 'Path to the Input File',
        type: 'string',
        setFunction: async () => {
            let uris = await vscode.window.showOpenDialog({canSelectMany: false});

            if (isUndefined(uris)) {
                return undefined;
            }
            return uris[0].fsPath;
        }
    }],
    ['timeout', {
        defaultValue: 2000,
        label: 'Timeout (ms)',
        description: 'Maximum program execution time.  The program will timeout if this threshold is reached',
        type: 'number',
        setFunction: async () => {
            let timeout = await vscode.window.showInputBox({
                prompt: 'New Timeout',
                placeHolder: 'timeout (ms)',
                value: '2000'
            });

            if (isUndefined(timeout) || isNaN(parseInt(timeout))) {
                return undefined;
            }
            return parseInt(timeout);
        }
    }]
]);

const ENTRIES: [string, OptionProperties][] = [...OPTIONS.entries()];

// -----------------------------------------------------------------------------------------------------------------------------
// Class to export
// -----------------------------------------------------------------------------------------------------------------------------

export class OptionManager {
    constructor(
        private extensionContext: vscode.ExtensionContext
    ) {}

    get(key: string): any {
        const val = this.extensionContext.workspaceState.get(key);
        if (isUndefined(val)) {
            return errorIfUndefined(OPTIONS.get(key), 'Invalid key!').defaultValue;
        }
        return val;
    }

    set(key: string, value: any): void {
        if (typeof value !== errorIfUndefined(OPTIONS.get(key), 'Invalid Key!').type) {
            throw new Error('Incorrect type!');
        }
        this.extensionContext.workspaceState.update(key, value);
    }

    defaultFor(key: string): any {
        return errorIfUndefined(OPTIONS.get(key), 'Invalid key!').defaultValue;
    }

    get entries(): [string, OptionProperties][] {
        return ENTRIES;
    }
}