import { OptionProperties, CategoryProperties } from "./options";
import { optionManager } from "../extension";
import { isUndefined } from "util";

import * as vscode from "vscode";

/**
 * Tries to parse an integer value, and returns undefined if it's not possible
 * @param val Value to parse
 */
function tryParseInt(val: string | undefined): number | undefined {
    if (isUndefined(val) || isNaN(parseInt(val))) {
        return undefined;
    }
    return parseInt(val);
}

export const OPTIONS: Map<string, Map<string, OptionProperties>> = new Map([
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
                    value: optionManager().get('buildAndRun', 'caseDelimeter')
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
                    value: optionManager().get('buildAndRun', 'timeout')
                }))
        }],
        ['memSample', {
            defaultValue: 100,
            label: 'Memory + Time Sample Interval',
            description: 'How quickly memory and time are sampled when a program is running',
            type: 'number',
            setFunction: async () => 
                tryParseInt(await vscode.window.showInputBox({
                    prompt: 'New Sample Interval',
                    placeHolder: 'Sample Interval (ms)',
                    value: optionManager().get('buildAndRun', 'memSample')
                }))
        }],
        ['charLimit', {
            defaultValue: 1000,
            label: 'Character Limit',
            description: 'The displays for stdout and stderr will be truncated to the given limit to prevent lag',
            type: 'number',
            setFunction: async () => 
                tryParseInt(await vscode.window.showInputBox({
                    prompt: 'New Character limit',
                    placeHolder: 'Character Limit',
                    value: optionManager().get('buildAndRun', 'charLimit')
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
                    placeHolder: optionManager().get('buildAndRun', 'reuseWebviews') ? 'Yes' : 'No'
                })) === 'Yes' 
        }]
    ])],
    ['compilerArgs', new Map([
        ['cpp', {
            defaultValue: '-Wall -O0 -DLOCAL',
            label: 'C++',
            description: 'Compiler: g++ -o <executable> <source file> <args>',
            type: 'string',
            setFunction: async () => 
                await vscode.window.showInputBox({
                    prompt: 'New Compiler Args',
                    placeHolder: 'C++ compiler args (space separated)',
                    value: optionManager().get('compilerArgs', 'cpp')
                })
        }]
    ])]
]);

export const CATEGORY_PROPERTIES: Map<string, CategoryProperties> = new Map([
    ['buildAndRun', {
        label: 'Build and Run',
        description: 'Build and Run Options'
    }],
    ['compilerArgs', {
        label: 'Compiler/Interpreter Arguments',
        description: 'Arguments for compilers/interpreters.  Hover over them to see how they are used'
    }]
]);
