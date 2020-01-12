import * as vscode from 'vscode';
import { errorIfUndefined } from '../extUtils';
import { Color } from './color';

export class ExtensionTerminalManager {
    private terminal: vscode.Terminal | undefined;
    private pty: vscode.Pseudoterminal;
    private writer: vscode.EventEmitter<string>;

    private _isClosed: boolean;

    // Command stuff
    private endl: string;
    private curCommand: string;

    // tslint:disable: curly
    constructor() {
        // Init stuff
        this._isClosed = true;
        this.curCommand = '';

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
                if (msg === this.endl.charAt(0)) {
                    this.write(this.endl.slice(1));
                    this.handleCommand(this.curCommand);
                    this.write(this.endl + '> ');
                    this.curCommand = '';
                }
                // tslint:disable-next-line: curly
                else {
                    this.curCommand += msg;
                    this.write(msg);
                }
            },
            onDidWrite: this.writer.event,
            open: () => {
                
            },
            close: () => {
                this._isClosed = true;
            }
        };
    }
    // tslint:enable: curly

    /**
     * Returns whether the terminal is currently closed
     */
    isClosed(): boolean {
        return this._isClosed;
    }

    /**
     * Opens an instance of the extension terminal.  Note that if the terminal is currently open at this point, the previous instance of it becomes lost 
     */
    open(): void {
        this._isClosed = false;
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

        this.write('Initialized CP Tools Terminal' + this.endl);
        this.write(`Running on platform ${process.platform} using version ${process.version}` + this.endl + this.endl);
        this.write('> ');
    }

    /**
     * Writes a message to the terminal
     * @param message The message to write
     */
    write(message: string) {
        this.writer.fire(message);
    }

    handleCommand(curCommand: string) {
    }
}
