import * as vscode from 'vscode';
import * as ext from './../extension';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../undefinedutils';

export interface OptionProperties {
    defaultValue: string | number | undefined; // Default value for this option
    label: string; // Label for this option
    description: string; // Description for this option
    type: string; // Type of this option
    setFunction: () => Thenable<string | number | undefined>; // Function called to set this option.  Return `undefined` if the set attempt failed
}

export interface CategoryProperties {
    label: string;
    description: string;
}

const OPTIONS: Map<string, Map<string, OptionProperties>> = new Map([
    ['buildAndRun', new Map([
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
        ['caseDelimeter', {
            defaultValue: '---',
            label: 'Case Delimeter',
            description: 'The delimeter that separates cases in the input file',
            type: 'string',
            setFunction: async () => {
                let args = await vscode.window.showInputBox({
                    prompt: 'This is the string that\'s used to separate cases in the input file',
                    placeHolder: 'New Case Delimeter',
                    value: ext.optionManager().get('buildAndRun', 'caseDelimeter')
                });

                return args;
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
                    value: ext.optionManager().get('buildAndRun', 'timeout')
                });
    
                if (isUndefined(timeout) || isNaN(parseInt(timeout))) {
                    return undefined;
                }
                return parseInt(timeout);
            }
        }]
    ])],
    ['compilerArgs', new Map([
        ['cpp', {
            defaultValue: '-Wall -static -DLOCAL',
            label: 'C++',
            description: 'Compiler: g++ -o <executable> <source file> <args>',
            type: 'string',
            setFunction: async () => {
                let args = await vscode.window.showInputBox({
                    prompt: 'New Compiler Args',
                    placeHolder: 'C++ compiler args (space separated)',
                    value: ext.optionManager().get('compilerArgs', 'cpp')
                });

                return args;
            }
        }]
    ])]
]);

const CATEGORY_PROPERTIES: Map<string, CategoryProperties> = new Map([
    ['buildAndRun', {
        label: 'Build and Run',
        description: 'Build and Run Options'
    }],
    ['compilerArgs', {
        label: 'Compiler/Interpreter Arguments',
        description: 'Arguments for compilers/interpreters.  Hover over them to see how they are used'
    }]
]);

// -----------------------------------------------------------------------------------------------------------------------------
// Class to export
// -----------------------------------------------------------------------------------------------------------------------------

export class OptionManager {
    constructor(
        private extensionContext: vscode.ExtensionContext
    ) {}

    private getProperties(category: string, key: string): OptionProperties {
        return errorIfUndefined(errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').get(key), 'Invalid key!');
    }

    getDefault(category: string, key: string): any {
        return this.getProperties(category, key).defaultValue;
    }

    get(category: string, key: string): any {
        const val = this.extensionContext.workspaceState.get(key);
        if (isUndefined(val)) {
            return this.getDefault(category, key);
        }
        return val;
    }

    set(category: string, key: string, value: any): void {
        if (typeof value !== this.getProperties(category, key).type) {
            throw new Error('Incorrect type!');
        }
        this.extensionContext.workspaceState.update(key, value);
    }

    entriesFor(category: string): [string, OptionProperties][] {
        return [...errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').entries()];
    }

    propertiesFor(category: string): CategoryProperties {
        return errorIfUndefined(CATEGORY_PROPERTIES.get(category), 'Invalid Category!');
    }

    get categories(): string[] {
        return [...OPTIONS.keys()];
    }
}