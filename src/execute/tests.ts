import * as vscode from 'vscode';
import * as fs from 'fs';
import { readWorkspaceFile, writeWorkspaceFile, errorIfUndefined, workspaceFilePath, undefinedIfEmpty } from '../extUtils';
import { isUndefined } from 'util';

interface Test {
    input: string;
    output: string | undefined;
}

// tslint:disable: curly
export class TestManager {
    testSets: Map<string, boolean[]>;

    constructor() {
        this.testSets = new Map();
    }

    readFromConfig(): void {
        const data = JSON.parse(readWorkspaceFile('testSets.json', '{ "default": [false] }'));
        for (const key of Object.keys(data))
            this.testSets.set(key, data[key]);
    }

    writeToConfig(): void {
        let obj: any = {};
        for (const [key, value] of this.testSets.entries())
            obj[key] = value;
        writeWorkspaceFile('testSets.json', JSON.stringify(obj));
    }

    // Utility/Internal Functions (Getters) (In all functions, key means test set name)
    get(key: string): boolean[] { return errorIfUndefined(this.testSets.get(key), `Invalid set name ${key}!`); }
    caseCount(key: string): number { return this.get(key).length; }

    // Input/output data interaction 
    private _caseFilePath(key: string, index: number, isInput: boolean) { return `tests_${key}_${index}_${isInput ? 'in' : 'out'}`; } // Assumed output if "isInput" is false
    caseFilePath(key: string, index: number, isInput: boolean) { return workspaceFilePath(this._caseFilePath(key, index, isInput)); } // Assumed output if "isInput" is false
    getInput(key: string, index: number) { return readWorkspaceFile(this._caseFilePath(key, index, true)); }
    getOutput(key: string, index: number) { return readWorkspaceFile(this._caseFilePath(key, index, false)); }
    openCaseFile(key: string, index: number, isInput: boolean): Thenable<vscode.TextDocument> {
        return vscode.workspace.openTextDocument(this.caseFilePath(key, index, isInput));
    }

    // Utility (In all functions, key means test set name)
    exists(key: string): boolean { return this.testSets.has(key); }
    addSet(key: string): void { this.testSets.set(key, []); }
    removeCases(key: string, index: number, count: number = 1) { // Note that indexes are 0-indexed
        this.get(key).splice(index, count);
        for (let i = index; i < index + count; i++) {
            for (const fileType of [false, true]) {
                if (fs.existsSync(this.caseFilePath(key, i + count, fileType)))
                    fs.renameSync(this.caseFilePath(key, i + count, fileType), this.caseFilePath(key, i, fileType));
                fs.unlinkSync(this.caseFilePath(key, i, fileType));
            }
        }
    }
    insertCases(key: string, index: number, count: number = 1): void { // Note that indexes are 0-indexed
        this.get(key).splice(index, 0, ...new Array(count));
        for (let i = index; i < index + count; i++) {
            for (const fileType of [false, true]) {
                if (fs.existsSync(this.caseFilePath(key, i, fileType)))
                    fs.renameSync(this.caseFilePath(key, i, fileType), this.caseFilePath(key, i + count, fileType));
                fs.closeSync(fs.openSync(this.caseFilePath(key, i, fileType), 'w'));
            }
        }
    }
    pushCase(key: string): void { this.insertCases(key, this.caseCount(key)); }
    disableCase(key: string, index: number): void { this.get(key)[index] = true; }
    enableCase(key: string, index: number): void { this.get(key)[index] = false; }
    getCases(key: string): Test[] { // only returns enabled cases
        return this.get(key).map((disabled, index) => <[boolean, number]>[disabled, index])
            .filter(obj => !obj[0])
            .map(obj => {
                const index = obj[1];
                return {
                    input: this.getInput(key, index),
                    output: undefinedIfEmpty(this.getOutput(key, index))
                };
        });
    }
    getCaseStructure(): any {
        let res: any = {};
        for (const [key, val] of this.testSets.entries())
            res[key] = val;
        return res;
    }
}
