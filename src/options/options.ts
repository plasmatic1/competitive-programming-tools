import * as vscode from 'vscode';
import * as ext from './../extension';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../undefinedutils';

export interface OptionProperties {
    defaultValue: string | number | boolean | undefined; // Default value for this option
    label: string; // Label for this option
    description: string; // Description for this option
    type: string; // Type of this option
    setFunction: () => Thenable<string | number | boolean | undefined>; // Function called to set this option.  Return `undefined` if the set attempt failed
}

export interface CategoryProperties {
    label: string;
    description: string;
}

// Tries to parse an integer value, and returns undefined if it's not possible
function tryParseInt(val: string | undefined): number | undefined {
    if (isUndefined(val) || isNaN(parseInt(val))) {
        return undefined;
    }
    return parseInt(val);
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
            setFunction: async () =>
                await vscode.window.showInputBox({
                    prompt: 'This is the string that\'s used to separate cases in the input file',
                    placeHolder: 'New Case Delimeter',
                    value: ext.optionManager().get('buildAndRun', 'caseDelimeter')
                })
        }],
        ['timeout', {
            defaultValue: 2000,
            label: 'Timeout (ms)',
            description: 'Maximum program execution time.  The program will timeout if this threshold is reached',
            type: 'number',
            setFunction: async () => 
                tryParseInt(await vscode.window.showInputBox({
                    prompt: 'New Timeout',
                    placeHolder: 'timeout (ms)',
                    value: ext.optionManager().get('buildAndRun', 'timeout')
                }))
        }],
        ['memSample', {
            defaultValue: 100,
            label: 'Memory + Time Sample Interval',
            description: 'How quickly memory and time are sampled when a program is running',
            type: 'number',
            setFunction: async () => 
                tryParseInt(await vscode.window.showInputBox({
                    prompt: 'New Timeout',
                    placeHolder: 'sampleInterval (ms)',
                    value: ext.optionManager().get('buildAndRun', 'memSample')
                }))
        }],
        ['reuseWebviews', {
            defaultValue: true,
            label: 'Reuse Webviews',
            description: 'Controls whether webviews are reused for buildAndRun, speeding up load times',
            type: 'boolean',
            setFunction: async () =>
                (await vscode.window.showQuickPick(['Yes', 'No'], { 
                    canPickMany: false,
                    placeHolder: ext.optionManager().get('buildAndRun', 'reuseWebviews') ? 'Yes' : 'No'
                })) === 'Yes' 
        }]
    ])],
    ['compilerArgs', new Map([
        ['cpp', {
            defaultValue: '-Wall -static -DLOCAL',
            label: 'C++',
            description: 'Compiler: g++ -o <executable> <source file> <args>',
            type: 'string',
            setFunction: async () => 
                await vscode.window.showInputBox({
                    prompt: 'New Compiler Args',
                    placeHolder: 'C++ compiler args (space separated)',
                    value: ext.optionManager().get('compilerArgs', 'cpp')
                })
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

// ---------------------------------------------------------------------------
// Class to export
// ---------------------------------------------------------------------------

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

    optionProperties(category: string, key: string): OptionProperties {
        return errorIfUndefined(errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').get(key), 'Invalid Key!');
    }

    categoryProperties(category: string): CategoryProperties {
        return errorIfUndefined(CATEGORY_PROPERTIES.get(category), 'Invalid Category!');
    }

    get categories(): string[] {
        return [...OPTIONS.keys()];
    }
}