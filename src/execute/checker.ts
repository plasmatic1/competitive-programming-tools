import { rootPath, normalizeOutput } from "../extUtils";
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CheckerLibraryFunctions {
    normalizeOutput: (str: string) => string;
    tokenize: (str: string) => string[];
    arrayEquals: <T>(a: T[], b: T[]) => boolean;
    arrayEqualsFloat: (a: string[], b: string[], eps: number) => boolean;
}

// tslint:disable: curly
export type CheckerFunction = (input: string, output: string, expectedOutput: string | null, libraryFunctions: CheckerLibraryFunctions) => boolean;

export enum Checker {
    Identical = 'identical',
    IdenticalNormalized = 'identicalNormalized',
    Tokens = 'tokens',
    Float4 = 'float:1e-4',
    Float9 = 'float:1e-9',
    Custom = 'custom'
}

export const DEFAULT_CHECKER = Checker.Tokens;

/**
 * Splits a string into tokens (split by whitespace)
 * @param str The input string
 */
function tokenize(str: string): string[] {
    return str.match(/\S+/g)?.map(x => x) || [];
}

/**
 * Returns if the two arrays have identical elements (in the same order)
 * @param a The first array
 * @param b The second array
 */
function arrayEquals<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    console.log('a='+JSON.stringify(a)+', b='+JSON.stringify(b));
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}

/**
 * Returns if two arrays of tokens have identical numbers, for a given Epsilon Delta
 * Note that if any element of any array is not a number, this function will return false
 * @param a The first array
 * @param b The second array
 * @param eps The precision (minimum amount that two elements can be different and still be considered equal)
 */
function arrayEqualsFloat(a: string[], b: string[], eps: number): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (Math.abs(parseFloat(a[i]) - parseFloat(b[i])) > eps) return false;
    return true;
}

/**
 * Returns a checker function for the given checker
 * @param checker The checker to get a function for.  A string is accepted because it can also be in the format custom:...
 */
export function getCheckerFunction(checker: string): CheckerFunction {
    switch(checker) {
        case Checker.Identical:
            return (_, out, expected, __) => out === expected;
        case Checker.IdenticalNormalized:
            return (_, out, expected, __) => normalizeOutput(out) === normalizeOutput(expected!);
        case Checker.Tokens:
            return (_, out, expected, __) => arrayEquals(tokenize(out), tokenize(expected!));
        case Checker.Float4:
            return (_, out, expected, __) => arrayEqualsFloat(tokenize(out), tokenize(expected!), 1e-4);
        case Checker.Float9:
            return (_, out, expected, __) => arrayEqualsFloat(tokenize(out), tokenize(expected!), 1e-9);
        default: {
            if (checker.startsWith('custom:')) {
                const rawPath = checker.substring('custom:'.length),
                    truePath = path.isAbsolute(rawPath) ? rawPath : path.join(rootPath(), rawPath);
                if (!fs.existsSync(truePath)) throw new Error(`Path of custom checker ${truePath} does not exist!`);
                if (path.extname(truePath) !== '.js') throw new Error(`Custom checker must be js file!`);

                const check = new Function(fs.readFileSync(truePath).toString() + 'return check;')();
                if (check === undefined) throw new Error('Custom checker must have check(input, output, expected, lib) function defined');
                return check;
            }
            else throw new Error(`Unknown checker ${checker}`);
        }
    }
}

/**
 * Checks a test case and returns whether the output was correct or not (true for correct, false for incorrect)
 * @param checker The checker function to check with
 * @param input The input
 * @param output The output
 * @param expected The expected output
 */
export function check(checker: CheckerFunction, input: string, output: string, expected: string | null): boolean {
    return checker(input, output, expected, {
        arrayEquals,
        arrayEqualsFloat,
        tokenize,
        normalizeOutput
    });
}

/**
 * Chooses a checker, returns undefined if no checker was chosen
 */
export async function chooseChecker(): Promise<string | undefined> {
    let checker = await vscode.window.showQuickPick(Object.values(Checker), { canPickMany: false, placeHolder: 'Checker Type' });
    
    if (checker !== undefined && checker === Checker.Custom) {
        const filePath = await chooseFile();
        if (filePath === undefined) return undefined;
        checker = checker.concat(':', filePath);
    }

    return checker;
}

/**
 * Opens a file dialog to choose a single file.  Returns undefined if none was chosen
 */
async function chooseFile(): Promise<string | undefined> {
    return (await vscode.window.showOpenDialog({ canSelectFolders: false, canSelectMany: false, canSelectFiles: true }))?.[0].fsPath;
}