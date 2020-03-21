import { isUndefined } from "util";

// Command handles should return null if the command was successful, and a string (error message) if it wasn't
export type CommandHandle = (curSet: string | null, curKey: number | null, ...args: any[]) => string | null;

// tslint:disable: curly
interface Command {
    args: (ArgType | DefaultArgType)[];
    requiresSet: boolean; // Whether a test set must be selected
    requiresIndex: boolean; // Whether a test case must be selected
    handle: CommandHandle;
}

export interface ArgType {
    isValid: (curSet: string | null, curIndex: number | null, arg: string) => null | string; // return undefined if it's valid, string (with error message) if not
    parse: (curSet: string | null, curIndex: number | null, arg: string) => any;
}
export type DefaultArgType = [ArgType, any]; // Argument with default

// String argument, always valid unless if empty
export const stringArg: ArgType = {
    isValid: (_, __, arg) => !arg ? 'Empty argument specified' : null,
    parse: (_, __, arg) => arg
};

// Integer argument
export const intArg: ArgType = {
    isValid: (_, __, arg) => isNaN(parseInt(arg)) ? `${arg} is not an integer!` : null,
    parse: (_, __, arg) => parseInt(arg)
};

// Choice argument, select from a set of choices
export function choiceArg(...choices: string[]): ArgType {
    const choicesSet = new Set(choices), invalidMessage = `Invalid choice, valid choices include: ${choices.join(', ')}`;
    return {
        isValid: (_, __, choice) => {
            if (!choicesSet.has(choice)) return invalidMessage;
            return null;
        },
        parse: (_, __, arg) => arg
    };
}

export class CommandHandler {
    commands: Map<string, Command> = new Map();
    aliases: Map<string, string> = new Map();
    fallback: (fullCommand: string) => void;
    onComplete: (message: string | null) => void;

    /**
     * Constructor for a handler
     * @param fallback A fallback method to call if a command dispatched matches none of the registered commands
     * @param onComplete A callback method to call once commands are complete
     */
    constructor(fallback: (fullCommand: string) => void, onComplete: (message: string | null) => void) {
        this.fallback = fallback;
        this.onComplete = onComplete;
    }

    /**
     * Dispatches a command
     * @param fullCommand Command
     * @param extra Extra arguments to send to the handler.  Note that extra arguments are sent first so that the content of actual arguments is always known
     */
    dispatchCommand(fullCommand: string, curSet: string | null, curIndex: number | null) {
        const spl = fullCommand.split(' '), command = this.aliases.get(spl[0]); spl.shift();
        if (isUndefined(command)) {
            this.fallback(fullCommand); 
            return;
        }

        // Get command
        const cmd = this.commands.get(command)!;
        
        // Check if selected test set and index are required
        if (cmd.requiresSet && curSet === null) {
            this.onComplete('No test set selected!');
            return;
        }
        if (cmd.requiresIndex && curIndex === null) {
            this.onComplete('No test index/case selected!');
            return;
        }

        // Parse arguments
        let args = [];
        for (const argOrDefault of cmd.args) {
            // Get argument type (and check whether the argument is present)
            // If it has a default and the argument is undefined, use the default, otherwise retrieve the corresponding ArgType
            let arg: ArgType;
            if (argOrDefault instanceof Array) { // Has default
                if (isUndefined(spl[0])) {
                    args.push(argOrDefault[1]);
                    spl.shift();
                    continue;
                }
                else arg = argOrDefault[0];
            }
            else {
                if (isUndefined(spl[0])) {
                    this.onComplete('Not enough arguments!');
                    return;
                }
                arg = argOrDefault;
            }

            // Parse argument
            const valid = arg.isValid(curSet, curIndex, spl[0]);
            if (valid === null) args.push(arg.parse(curSet, curIndex, spl[0]));
            else {
                this.onComplete(valid);
                return;
            }
            spl.shift();
        }

        // Run command
        const message = cmd.handle(curSet, curIndex, ...args);
        this.onComplete(message);
    }

    /**
     * Registers a command
     * @param name The name of the command
     * @param handle The command handler for this command
     * @param args A list of ArgType, the argument types for this command (in order)
     * @param requiresSet Whether a test set must be selected for this command to work (default: false)
     * @param requiresIndex Whether a test case must be selected for this command to work (default: false)
     * @param aliases A list of aliases for this command (optional)
     */
    registerCommand(name: string, handle: CommandHandle, args: (ArgType | DefaultArgType)[], requiresSet: boolean = false, requiresIndex: boolean = false, aliases?: string[]) {
        this.aliases.set(name, name);
        if (!isUndefined(aliases))
            for (const alias of aliases)
                this.aliases.set(alias, name);
        this.commands.set(name, { handle, args, requiresSet, requiresIndex });
    }
}
