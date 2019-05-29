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

export class EndEvent implements Event {
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
