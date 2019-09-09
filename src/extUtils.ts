import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { isUndefined } from 'util';

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
 * Reads a file from the path <workspace>/.vscode/<path>
 * @param filePath The path of the file relative to the .vscode folder
 * @param defaultContent The default content of the file.  Defaults to ''
 * @returns The read data, or the default if it doesn't exist
 */
export function readWorkspaceFile(filePath: string, defaultContent: string = ''): string {
    if (isUndefined(vscode.workspace.rootPath)) {
        throw new Error('Not in a workspace!');
    }

    const pathDir = path.join(vscode.workspace.rootPath, '.vscode'), fullFilePath = path.join(pathDir, filePath);
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
    if (isUndefined(vscode.workspace.rootPath)) {
        throw new Error('Not in a workspace!');
    }

    const pathDir = path.join(vscode.workspace.rootPath, '.vscode');
    if (!fs.existsSync(pathDir)) {
        fs.mkdirSync(pathDir);
    }

    fs.writeFileSync(path.join(pathDir, filePath), data);
}
