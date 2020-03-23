import * as fs from 'fs';
import { readWorkspaceFile, errorIfUndefined, workspaceFilePath, nullIfEmpty, showFile, writeWorkspaceFile } from '../extUtils';

export interface Test {
    index: number;
    input: string;
    output: string | null;
}

export interface TestSet {
    tests: Test[];
    checker: string | null;
}

export class TestSetInfo {
    disabled: boolean[] = [];
    checker: string | null = null;
}

// tslint:disable: curly
export class TestManager {
    public testSets: Map<string, TestSetInfo>;

    constructor() {
        this.testSets = new Map();
    }

    readFromConfig(): void {
        const data = JSON.parse(readWorkspaceFile('testSets.json', `{ "default": { "disabled": [false], "checker": null }}`));
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
    get(key: string): TestSetInfo { return errorIfUndefined(this.testSets.get(key), `Invalid set name ${key}!`); }
    caseCount(key: string): number { return this.get(key).disabled.length; }

    // Input/output data interaction 
    private _caseFilePath(key: string, index: number, isInput: boolean) { return `tests_${key}_${index}_${isInput ? 'in' : 'out'}`; } // Assumed output if "isInput" is false
    caseFilePath(key: string, index: number, isInput: boolean) { return workspaceFilePath(this._caseFilePath(key, index, isInput)); } // Assumed output if "isInput" is false
    getInput(key: string, index: number) { return readWorkspaceFile(this._caseFilePath(key, index, true)); }
    getOutput(key: string, index: number) { return readWorkspaceFile(this._caseFilePath(key, index, false)); }
    openCaseFile(key: string, index: number, isInput: boolean) {
        showFile(this.caseFilePath(key, index, isInput));
    }

    // Utility (In all functions, key means test set name)
    exists(key: string): boolean { return this.testSets.has(key); }
    addSet(key: string): void { this.testSets.set(key, new TestSetInfo()); }
    removeSet(key: string): void { this.removeCases(key, 0, this.caseCount(key)); this.testSets.delete(key); }
    removeCases(key: string, index: number, count: number = 1) { // Note that indexes are 0-indexed
        this.get(key).disabled.splice(index, count);
        for (let i = index; i < index + count; i++) {
            for (const fileType of [false, true]) {
                fs.unlinkSync(this.caseFilePath(key, i, fileType));
                if (fs.existsSync(this.caseFilePath(key, i + count, fileType)))
                    fs.renameSync(this.caseFilePath(key, i + count, fileType), this.caseFilePath(key, i, fileType));
            }
        }
    }
    insertCases(key: string, index: number, count: number = 1): void { // Note that indexes are 0-indexed
        this.get(key).disabled.splice(index, 0, ...new Array(count).fill(false));

        // Shift (rename) cases at index>=index
        for (let i = this.get(key).disabled.length; i >= index; i--) {
            for (const fileType of [false, true])
                if (fs.existsSync(this.caseFilePath(key, i, fileType)))
                    fs.renameSync(this.caseFilePath(key, i, fileType), this.caseFilePath(key, i + count, fileType));
        }
        // Create new test case files
        for (let i = index; i < index + count; i++) {
            for (const fileType of [false, true])
                fs.closeSync(fs.openSync(this.caseFilePath(key, i, fileType), 'w'));
        }
    }
    pushCase(key: string): void { this.insertCases(key, this.caseCount(key)); }
    disableCase(key: string, index: number): void { this.get(key).disabled[index] = true; }
    enableCase(key: string, index: number): void { this.get(key).disabled[index] = false; }
    getCases(key: string): TestSet { // only returns enabled cases
        return {
            checker: this.get(key).checker,
            tests: this.get(key).disabled.map((disabled, index) => <[boolean, number]>[disabled, index])
                .filter(obj => !obj[0])
                .map(obj => {
                    const index = obj[1];
                    return {
                        index,
                        input: this.getInput(key, index),
                        output: nullIfEmpty(this.getOutput(key, index))
                    };
            })
        };
    }
    getCaseStructure(): any {
        let res: any = {};
        for (const [key, val] of this.testSets.entries())
            res[key] = val;
        return res;
    }

    // Get/set checker
    getChecker(key: string): string | null { return this.get(key).checker; }
    setChecker(key: string, checker: string | null): void { this.get(key).checker = checker; }
}
