import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as exe from './events';
import * as pidusage from 'pidusage';
import { getWebview, unlinkWebview } from '../display/displayManager';
import { join } from 'path';
import { Executor, executors } from './executors';
import { isUndefined, isNull } from 'util';
import { popUnsafe } from '../undefinedutils';
import { optionManager, VUE_PATH } from '../extension';
import { ChildProcess } from 'child_process';

/**
 * Resolves the test cases
 */
function resolveTestCases(): string {  
    if (!fs.existsSync(inputFilePath)) {
        vscode.window.showErrorMessage(`Could not find input file ${inputFilePath}`);
        return;
    }        
        
    const inputs: string[] = fs.readFileSync(inputFilePath).toString().split(optionManager().get('buildAndRun', 'caseDelimeter'));
}

/**
 * Compiles the program and throws an error if the compile failed
 * @param src The source file name
 * @returns The path to the executable if the file was compiled.  Undefined if the language used is interpreted and no compilation needs to be done
 */
function compile(src: string): string | undefined {
    return undefined
}

/**
 * Executes the program and throws any errors if they are encountered
 * @param exe The file path of the executable
 * @param caseno The case number
 * @param input The input data
 * @param output The output data
 */
function execute(exe: string, caseno: number, input: string, output: string): void {

}

/**
 * Bundles all three operations together and attaches any required event handlers.  If anything fails, an error will be thrown.
 * @param src The source file path
 */
function _run(src: string): void {
    resolveTestCases();
}   

/**
 * Wrapper around the _run() function that catches Exceptions and turns them into proper error messages
 * @param src The source file path
 */
export function run(src: string): void {
    try {
        _run(src);
    }
    catch (e) {
        vscode.window.showErrorMessage(e);
        console.log(e);
    }
}

/**
 * Halts a currently running process (if one exists)
 */
export function halt(): void {

}
