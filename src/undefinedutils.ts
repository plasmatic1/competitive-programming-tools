import { isUndefined } from "util";

export function errorIfUndefined<T>(value: T | undefined, message: string = 'Undefined Value!'): T {
    if (isUndefined(value)) {
        throw new Error(message);
    }
    return value;
}