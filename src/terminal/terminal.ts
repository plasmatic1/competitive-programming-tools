import * as vscode from 'vscode';
import { errorIfUndefined } from '../extUtils';

// Max amount of previous commands stored
const MAX_HISTORY: number = 10;

// Default string used to clear lines
const DEFAULT_CLEAR_STRING = ' '.repeat(256);

export class ExtensionTerminalManager {
    private terminal: vscode.Terminal | undefined;
    private pty: vscode.Pseudoterminal;
    private writer: vscode.EventEmitter<string>;

    // Some other general terminal stuff
    private _isClosed: boolean = true;

    // Command stuff
    private endl: string = ''; // The string to use to end a line.  Platform dependent
    private curCommand: string = ''; // Current command
    private insertPtr: number = -1; // Pointer that maintains current location on the line to insert
    private previousCommands: string[] = []; // Previous Commands
    private previousCommandsRedo: string[] = []; // Previous commands (redo)

    // tslint:disable: curly
    constructor() {
        // Init stuff
        this.initTerminalState();

        // Init platform-dependent stuff
        const platform = process.platform;
        if (platform === 'win32')
            this.endl = '\r\n'; // windows
        else if (platform === 'darwin')
            this.endl = '\r'; // osx
        else
            this.endl = '\n'; // linux or something

        // Initialize pty
        this.writer = new vscode.EventEmitter<string>();
        this.pty = {
            handleInput: (msg: string) => {
                if (msg.charCodeAt(0) === 27) { // arrows
                    // const num: number = parseInt(msg.slice(2, -1)), dir: string = msg.charAt(msg.length - 1);
                    const num: number = 1, dir: string = msg.charAt(msg.length - 1); // TODO: Implement number detection

                    // Left/Right Nav
                    if (dir === 'D') { // Left
                        this.insertPtr = Math.max(0, this.insertPtr - num);
                        this.write(msg);
                    }
                    else if (dir === 'C') { // Right
                        this.insertPtr = Math.min(this.curCommand.length, this.insertPtr + num);
                        this.write(msg);
                    }

                    // Up/Down History
                    else if (dir === 'B') { // Down
                        const nextCommand: string | undefined = this.previousCommandsRedo.pop();
                        if (nextCommand !== undefined) {
                            this.previousCommands.push(this.curCommand);
                            this.curCommand = nextCommand;
                        }

                        this.rewriteCommand();
                    }
                    else if (dir === 'A') { // Up
                        const nextCommand: string | undefined = this.previousCommands.pop();
                        if (nextCommand !== undefined) {
                            this.previousCommandsRedo.push(this.curCommand);
                            this.curCommand = nextCommand;
                        }

                        this.rewriteCommand();
                    }
                }
                else if (msg.charCodeAt(0) === 127) { // Backspace
                    if (this.insertPtr > 0) {
                        this.curCommand = this.curCommand.slice(0, this.insertPtr - 1) + this.curCommand.slice(this.insertPtr);
                        this.insertPtr--;

                        const toDelete = 
                    }
                }
                else if (msg === this.endl.charAt(0)) { // Newline
                    // Empty line, there is no command to be executed
                    if (this.curCommand.length === 0)
                        return;

                    this.write(this.endl);

                    this.handleCommand(this.curCommand);
                    this.previousCommands.push(this.curCommand);
                    if (this.previousCommands.length > MAX_HISTORY)
                        this.previousCommands.shift();
                    this.previousCommandsRedo.length = 0;

                    this.curCommand = '';
                    this.insertPtr = 0;

                    this.write(this.endl + '> ');
                }
                else { // Normal char
                    this.curCommand = this.curCommand.slice(0, this.insertPtr) + msg + this.curCommand.slice(this.insertPtr);
                    this.insertPtr++;
                    this.rewriteCommand();
                }

                console.log(`Msg: "${msg}", charcode: ${msg.charCodeAt(0)}, cpt: ${msg.codePointAt(0)}`);
                console.log(`Cmd: ${this.curCommand} (len: ${this.curCommand.length}), insptr: ${this.insertPtr}, slup: ${this.curCommand.slice(0, this.insertPtr)}`);
            },
            onDidWrite: this.writer.event,
            open: () => {
                this._isClosed = false;
                this.initTerminalState();

                this.write('Initialized CP Tools Terminal' + this.endl);
                this.write(`Running on platform ${process.platform}` + this.endl + this.endl);
                this.write('> ');
            },
            close: () => {
                this._isClosed = true;
            }
        };
    }
    // tslint:enable: curly

    // Internal functions

    /**
     * Initializes all the state variables for the terminal (i.e. the ones that keep track of history, navigation, etc.)
     */
    private initTerminalState(): void {
        this.insertPtr = 0;
        this.curCommand = '';
        this.previousCommands = [];
        this.previousCommandsRedo = [];
    }
 
    /**
     * Handles commands
     * @param command The command string to handle
     */
    private handleCommand(command: string): void {
        this.write(`You ran command "${command}" ${this.endl}`);
    }

    /**
     * Clears the current line and writes the current command along with the prompt
     * @param clearString The string used to clear the line 
     */
    private rewriteCommand(clearString: string = DEFAULT_CLEAR_STRING): void {
        this.clearLine(clearString);
        this.write('> ' + this.curCommand);
    }

    // State-retrieving functions

    /**
     * Returns whether the terminal is currently closed
     */
    isClosed(): boolean {
        return this._isClosed;
    }

    // State changing functions

    /**
     * Opens an instance of the extension terminal.  Note that if the terminal is currently open at this point, the previous instance of it becomes lost 
     */
    open(): void {
        this.terminal = vscode.window.createTerminal({
            name: "CP Tools",
            pty: this.pty
        });
    }

    /**
     * "shows" (or focuses) the current CP Tools terminal instance
     */
    show(): void {
        errorIfUndefined(this.terminal, 'Terminal is not open!').show();
    }

    // Terminal writing related

    /**
     * Writes a message to the terminal
     * @param message The message to write
     */
    write(message: string): void {
        this.writer.fire(message);
    }

    /**
     * Moves the cursor left by a specified amount
     * @param num The amount to move the cursor by
     */
    left(num: number): void {
        this.write(`\x1b[${num}D`);
    }

    /**
     * Moves the cursor right by a specified amount
     * @param num The amount to move the cursor by
     */
    right(num: number): void {
        this.write(`\x1b[${num}C`);
    }

    /**
     * Moves the "cursor" back to the start of the line
     */
    restartLine(): void {
        this.left(1024);
    }

    /**
     * Clears the line (overwrites all visible characters with whitespace)
     * @param clearString String used to clear the line, defaults to 512 spaces
     */
    clearLine(clearString: string = DEFAULT_CLEAR_STRING): void {
        this.write('\x1b[1024D' + clearString + '\x1b[1024D'); 
    }
}
