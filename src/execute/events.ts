import { isUndefined, isNull } from "util";
import * as sub from 'child_process';

export enum ResultType {
    SUCCESS = 'Success', 
    TIMEOUT = 'Timeout', 
    RUNTIME_ERROR = 'Runtime Error', 
    INTERNAL_ERROR = 'Internal Error (spawn() call failed)',
    COMPILE_ERROR = 'Compile Error'
}

export enum EventType {
    COMPILER_ERROR = 'compilerError',
    BEGIN_CASE = 'beginCase',
    UPDATE_TIME = 'updateTime',
    UPDATE_MEMORY = 'updateMemory',
    UPDATE_STDOUT = 'updateStdout',
    UPDATE_STDERR = 'updateStderr',
    END = 'end'
}

export interface Event {
    readonly type: EventType;
}

export class CompileErrorEvent implements Event {
    type: EventType = EventType.COMPILER_ERROR;
    constructor(public readonly data: string, public readonly fatal: boolean) {}
}

export class BeginCaseEvent implements Event {
    type: EventType = EventType.BEGIN_CASE;
    constructor(public readonly input: string) {}
}

export class UpdateTimeEvent implements Event {
    type: EventType = EventType.UPDATE_TIME;
    constructor(public readonly newElapsed: number) {}
}

export class UpdateMemoryEvent implements Event {
    type: EventType = EventType.UPDATE_MEMORY;
    constructor(public readonly newMemory: number) {}
}

export class UpdateStdoutEvent implements Event {
    type: EventType = EventType.UPDATE_STDOUT;
    constructor(public readonly data: string) {}
}

export class UpdateStderrEvent implements Event {
    type: EventType = EventType.UPDATE_STDERR;
    constructor(public readonly data: string) {}
}

export class FinishedEvent implements Event {
    type: EventType = EventType.END;
    constructor(public readonly endMsg: string){}
}

export interface Result {
    exitType: ResultType; // Type of result
    exitDetail: string; // Any other details associated with the result type.  Ommitted for Success
    error?: string; // The error of the program.
    output?: string; // The output of the program.  Ommitted if result was TIMEOUT
    execTime?: number; // Execution Time
    memoryUsage?: number; // Memory Usage
}

export async function interpretReturnBuffer(ret: sub.SpawnSyncReturns<Buffer>): Promise<Result> {
    // const stats = await pidusage(ret.pid), execTime = stats.elapsed, memoryUsage = stats.memory / 1024.;
    const execTime = 0.0, memoryUsage= 6969;

    if (!isUndefined(ret.error)) {
        return {
            exitType: ResultType.INTERNAL_ERROR,
            exitDetail: `spawn() call failed: ${ret.error.name}: ${ret.error.message}`,
            execTime,
            memoryUsage
        };
    }

    const output = isNull(ret.stdout) ? 'No Output' : ret.stdout.toString(), 
            error = isNull(ret.stderr) ? 'No Errors' : ret.stderr.toString();

    if (!isNull(ret.signal)) {
        return {
            exitType: ret.signal === 'SIGTERM' ? ResultType.TIMEOUT : ResultType.RUNTIME_ERROR,
            exitDetail: `Killed by Signal: ${ret.signal}` + (ret.signal === 'SIGTERM' ? ' (Possible timeout?)' : ''),
            output,
            error,
            execTime,
            memoryUsage
        };
    }

    var exitDetail: string = `Exit code: ${ret.status}`;
    if (ret.status > 255) {
        exitDetail += ' (Possible Segmentation Fault?)';
    }

    return {
        exitType: ret.status !== 0 ? ResultType.RUNTIME_ERROR : ResultType.SUCCESS,
        exitDetail,
        output,
        error,
        execTime,
        memoryUsage
    };
}