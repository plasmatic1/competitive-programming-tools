import * as fs from 'fs';
import { normalizeOutput } from '../extUtils';

// tslint:disable:curly

export interface Test {
    index: number;
    input: string;
    output: string | null;
}

export interface TestSet {
    tests: Test[];
    checker: string | null;
    disabled: boolean[];
}

/*
SAMPLE TEST SET 

:checker tokens

:in
3
1 2 3

:out
5

:dis
:in
5
1 2 3 4 5

:out
7

*/

enum Mode {
    Input, Output, None
};

export function getSet(path: string): TestSet {
    let tests: Test[] = [], disabled: boolean[] = [], checker: string | null = null, curInput = '', curOutput = '', curDisabled = false, mode = Mode.None;
    const lines = normalizeOutput(fs.readFileSync(path).toString()).split(/\n/g);

    function addTestIfOutputMode() {
        if (mode === Mode.Output) {
            tests.push({ index: tests.length, input: curInput, output: curOutput });
            disabled.push(curDisabled);
        }
    }

    for (let line of lines) {
        if (line.startsWith(':checker'))
            checker = line.split(' ')[1];
        else if (line.trim() === ':in') {
            addTestIfOutputMode();
            mode = Mode.Input;
        }
        else if (line.trim() === ':out')
            mode = Mode.Output;
        else if (line.trim() === ':dis') {
            addTestIfOutputMode();
            curDisabled = true;
        }
        else {
            if (mode === Mode.Input)
                curInput += line + '\n';
            else if (mode === Mode.Output)
                curOutput += line + '\n';
        }
    }
    addTestIfOutputMode();

    return {
        tests,
        disabled,
        checker
    };
}

export function writeSet(path: string, set: TestSet): void {
    let data = `:checker ${set.checker}\n\n`, len = set.tests.length;
    for (let i = 0; i < len; i++) {
        if (set.disabled[i])
            data += ':dis\n';
        data += ':in\n' +
            set.tests[i].input + '\n' +
            ':out\n' +
            set.tests[i].output + '\n';
    }

    fs.writeFileSync(path, data);
}
