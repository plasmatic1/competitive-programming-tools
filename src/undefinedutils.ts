import { isUndefined } from "util";

export function errorIfUndefined<T>(value: T | undefined, message: string = 'Undefined Value!'): T {
    if (isUndefined(value)) {
        throw new Error(message);
    }
    return value;
}

export function popUnsafe<T>(array: T[], message: string = 'Empty Array!'): T {
    const val: T | undefined = array.pop();
    if (isUndefined(val)) {
        throw new Error(message);
    }
    return val;
}