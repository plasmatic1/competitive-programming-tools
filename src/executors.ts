import * as sub from 'child_process';
import * as fs from 'fs';
import { isUndefined } from 'util';

// -----------------------------------------------------------------------------------------------------------------------------
// Result Interfaces
// -----------------------------------------------------------------------------------------------------------------------------
enum ResultType {
    SUCCESS, TIMEOUT, RTE
}

interface IResult {
    type: ResultType; // Type of result
    typeDetail?: string; // Any other details associated with the result type.  Ommitted for Success
    output?: string; // The output of the program.  Ommitted if result was TIMEOUT
    execTime: number; // Execution Time
    memoryUsage: number; // Memory Usage
}

interface IExecutor {
    srcFile: string; // Source file
    execFile?: string | undefined; // Executable file.  Null if not compiled yet
    preExec: () => string; // Compilation - Returns file name of executable created (to be run)
    exec: (input: string) => IResult; // Execution - Runs the file with the input, and returns 
    postExec: () => void; // Post execution - Any 
}

// -----------------------------------------------------------------------------------------------------------------------------
// Executors
// -----------------------------------------------------------------------------------------------------------------------------
class CPPExecutor implements IExecutor {
    srcFile: string;
    execFile: string | undefined;

    constructor(srcFile: string) {
        this.srcFile = srcFile;
        this.execFile = undefined;
    }

    preExec(): string {
        this.execFile = this.srcFile.substring(0, this.srcFile.length - 3) + 'exe';
        sub.spawnSync(`g++ -o ${this.execFile} ${this.srcFile} -Wall -static`);
        return this.execFile;
    }

    exec(input: string): IResult {
        if (isUndefined(this.execFile)) {
            throw new Error('File not compiled yet!');
        }

        const ret = sub.spawnSync(this.execFile, {timeout: 2});

        return {type: ResultType.SUCCESS, execTime:0, memoryUsage:0};
    }

    postExec() {
        if (isUndefined(this.execFile)) {
            throw new Error('File not compiled yet!');
        }

        fs.unlinkSync(this.execFile);
    }
}

class PYExecutor implements IExecutor {
    srcFile: string;

    constructor(srcFile: string) {
        this.srcFile = srcFile;
    }

    preExec(): string { return this.srcFile; }

    exec(input: string): IResult {
        return {type: ResultType.SUCCESS, execTime:0, memoryUsage:0};
    }

    postExec() {}
}

export const executors: Map<string, Function> = new Map([
    ['cpp', CPPExecutor.constructor],
    ['py', PYExecutor.constructor]
]);