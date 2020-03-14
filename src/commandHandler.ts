import { isUndefined } from "util";

// Command handles should return null if the command was successful, and a string (error message) if it wasn't
export type CommandHandle = (...args: any[]) => string | null;

// tslint:disable: curly
class CommandHandler {
    commands: Map<string, CommandHandle> = new Map();
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
    dispatchCommand(fullCommand: string, ...extra: any[]) {
        const spl = fullCommand.split(' '), command = this.aliases.get(spl[0]);
        if (isUndefined(command)) {
            this.fallback(fullCommand); 
            return;
        }

        const message = this.commands.get(command)!(...extra, ...spl.slice(1));
        this.onComplete(message);
    }

    /**
     * Registers a command
     * @param name Name of the command
     * @param aliases Any aliases for the command
     * @param handle Handle for the command
     */
    registerCommand(name: string, handle: CommandHandle, aliases?: string[]) {
        this.aliases.set(name, name);
        if (!isUndefined(aliases))
            for (const alias of aliases)
                this.aliases.set(alias, name);
        this.commands.set(name, handle);
    }
}

export default CommandHandler;
