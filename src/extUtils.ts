import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { isUndefined } from 'util';

// tslint:disable: curly

// =================================================================================================================
// Utility functions
// =================================================================================================================

/**
 * Undefined if the string is empty, otherwise the string itself
 * @param string The string to transform
 */
export function undefinedIfEmpty(string: string): string | undefined {
    return string.length > 0 ? string : undefined;
}

/**
 * Null if the string is empty, otherwise the string itself.  This is almost identical to undefinedIfEmpty
 * @param string The string to transform
 */
export function nullIfEmpty(string: string): string | null {
    return string.length > 0 ? string : null;
}

/**
 * Checks if a value is undefined and then throws an error if it is.
 * @param value The value to check
 * @param message The error message to show
 */
export function errorIfUndefined<T>(value: T | undefined, message: string = 'Undefined Value!'): T {
    if (isUndefined(value)) {
        throw new Error(message);
    }
    return value;
}

/**
 * Forcibly pops the last element of an array, displaying an error message if the array is empty
 * @param array The array
 * @param message The error message to display
 */
export function popUnsafe<T>(array: T[], message: string = 'Empty Array!'): T {
    const val: T | undefined = array.pop();
    if (isUndefined(val)) {
        throw new Error(message);
    }
    return val;
}

/**
 * Opens the path given as a file and shows it in the text editor.  This is simply a shorthand
 * @param path The path of the file to show
 */
export async function showFile(path: string) {
    vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(path)));
}

// =================================================================================================================
// Interacting with workspace files
// =================================================================================================================

/**
 * Returns the path for a temp file with a given name.  Format is tmp-<name>-<random numbers> if name is specified and tmp-<random numbers> otherwise
 * @param name The name of the temp file
 */
export function getTempFile(name: string | undefined = undefined): string {
    const pref = 'tmp' + (isUndefined(name) ? '' : `-${name}`);
    const used = new Set(fs.readdirSync(rootPath()));
    let res;
    do
        res = pref + '-' + Math.random().toString().slice(2, 8);
    while (used.has(res));
    return path.join(rootPath(), res);
}

/**
 * Returns the root path of vscode (where the application is currently open).
 * An error will be thrown if the application is not open in a folder
 */
export function rootPath(): string {
    return errorIfUndefined(vscode.workspace.rootPath, 'VSCode not open in a folder!');
}

/**
 * Reads a file from the path <workspace>/.vscode/<path>
 * @param filePath The path of the file relative to the .vscode folder
 * @param defaultContent The default content of the file.  Defaults to ''
 * @returns The read data, or the default if it doesn't exist
 */
export function readWorkspaceFile(filePath: string, defaultContent: string = ''): string {
    const pathDir = path.join(rootPath(), '.vscode'), fullFilePath = path.join(pathDir, filePath);
    if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir);
    }
    if (!fs.existsSync(fullFilePath)) {
        fs.writeFileSync(fullFilePath, defaultContent);
        return defaultContent;
    }
    
    let ret = fs.readFileSync(path.join(pathDir, filePath)).toString();
    return ret;
}

/**
 * Writes a file to the path <workspace>/.vscode/<path>
 * @param filePath The path of the file relative to the .vscode folder
 * @param data The data to write
 */
export function writeWorkspaceFile(filePath: string, data: string): void {
    const pathDir = path.join(rootPath(), '.vscode');
    if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir);
    }

    fs.writeFileSync(path.join(pathDir, filePath), data);
}

/**
 * Returns the absolute file path of a workspace file path (relative)
 * @param filePath The path of the file (relative to the .vscode folder)
 */
export function workspaceFilePath(filePath: string): string {
    return path.join(rootPath(), '.vscode', filePath);
}
