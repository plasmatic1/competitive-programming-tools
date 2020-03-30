import * as vscode from 'vscode';

export class Color {
    static black = new Color('30');
    static red = new Color('31');
    static green = new Color('32');
    static yellow = new Color('33');
    static blue = new Color('34');
    static magenta = new Color('35');
    static cyan = new Color('36');
    static white = new Color('37');
    static reset = new Color('0');

    static bold = new Color('1');
    static underline = new Color('4');
    static reverse = new Color('7');

    constructor(private readonly code: string) {}

    toString(): string {
        return `\u001b[${this.code}m`;
    }
}

export class Logger {
    log: vscode.OutputChannel;

    constructor(name: string) {
        this.log = vscode.window.createOutputChannel(name);
    }

    show() { this.log.show(); }
    dispose() { this.log.dispose(); }

    // Log levels
    info(msg: string) { this.log.appendLine('INFO ' + msg); }
    warning(msg: string) { this.log.appendLine('WARN ' + msg); }
    error(msg: string) { this.log.appendLine('ERROR ' + msg); }
    fatal(msg: string) { this.log.appendLine('FATAL ' + msg); }
}
