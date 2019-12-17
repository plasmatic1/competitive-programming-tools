export enum ResultType {
    SUCCESS = 'Success', 
    TIMEOUT = 'Timeout', 
    RUNTIME_ERROR = 'Runtime Error', 
    INTERNAL_ERROR = 'Internal Error (spawn() call failed)',
    COMPILE_ERROR = 'Compile Error'
}

export enum EventType {
    COMPILE_ERROR = 'compileError',
    BEGIN_CASE = 'beginCase',
    UPDATE_TIME = 'updateTime',
    UPDATE_MEMORY = 'updateMemory',
    UPDATE_STDOUT = 'updateStdout',
    UPDATE_STDERR = 'updateStderr',
    END = 'end',
    RESET = 'reset'
}

export class Event {
    constructor(public readonly type: EventType, public readonly event: { caseNo: number, [propName: string]: any }) {}
}

export class CompileErrorEvent extends Event {
    constructor(data: string, fatal: boolean) {
        super(EventType.COMPILE_ERROR, { caseNo: -1, data, fatal });
    }
}

export class BeginCaseEvent extends Event {
    constructor(input: string, output: string | undefined, caseNo: number) {
        super(EventType.BEGIN_CASE, { caseNo, input, output });
    }
}

export class UpdateTimeEvent extends Event {
    constructor(newElapsed: number, caseNo: number) {
        super(EventType.UPDATE_TIME, { caseNo, newElapsed });
    }
}

export class UpdateMemoryEvent extends Event {
    constructor(newMemory: number, caseNo: number) {
        super(EventType.UPDATE_MEMORY, { caseNo, newMemory });
    }
}

export class UpdateStdoutEvent extends Event {
    constructor(data: string, caseNo: number) {
        super(EventType.UPDATE_STDOUT, { caseNo, data });
    }
}

export class UpdateStderrEvent extends Event {
    constructor(data: string, caseNo: number) {
        super(EventType.UPDATE_STDERR, { caseNo, data });
    }
}

export class EndEvent extends Event {
    constructor(endMsg: string[], isCorrect: boolean, isInvalidReturn: boolean, caseNo: number) {
        super(EventType.END, { caseNo, isCorrect, isInvalidReturn, endMsg });
    }   
}

export class ResetEvent extends Event {
    constructor(caseCnt: number) {
        super(EventType.RESET, { caseNo: -1, caseCnt, });
    }
}

export interface Result {
    exitType: ResultType; // Type of result
    exitDetail: string; // Any other details associated with the result type.  Ommitted for Success
    error?: string; // The error of the program.
    output?: string; // The output of the program.  Ommitted if result was TIMEOUT
    execTime?: number; // Execution Time
    memoryUsage?: number; // Memory Usage
}
