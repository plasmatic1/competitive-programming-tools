import * as vscode from 'vscode';
import * as fs from 'fs';
import { join } from 'path';


export class TemplateParser {
    public templates: [string, string[]][] = [];
    public logger: vscode.Terminal = vscode.window.createTerminal('Load Template Logger');

    constructor() {
        this.logger.sendText('@echo off');
        this.logger.show();
    }

    private log(message: string) {
        this.logger.sendText(`echo "${message}"`);
    }

    // Traverses a template folder for template files
    traverseFolder(curPath: string, templatePath: string = ''): void {
        for (const sub of fs.readdirSync(curPath)) {
            const adjPath = join(curPath, sub), stats = fs.lstatSync(adjPath);

            console.log(`path: ${curPath}, templatePath: ${templatePath}, adjPath: ${adjPath}, isDir: ${stats.isDirectory()}`);

            if (stats.isDirectory()) {
                this.traverseFolder(adjPath, join(templatePath, sub));
            }
            else if (stats.isFile()) {
                this.parseFile(adjPath, templatePath);
            }
            else {
                this.log(`Skipping path '${adjPath}' as it's not a file or directory`);
            }
        }
    }

    // Parses a template file
    private parseFile(path: string, templatePath: string): void {
        let curTemplate: string[] = [], curName: string = '';
        for (const line of fs.readFileSync(path).toString().split(/\r?\n/g)) {
            const logError = (message: string) => {
                // Lambda declaration to not override `this` variable
                this.log(`Skipping line '${line}' of path '${path}' ${message}`);
            };

            const spls = line.split(' ');
            if (line.startsWith('//begintemplate')) {
                if (spls.length !== 2) {
                    logError('as it\'s not a valid begin template line (invalid space count)');
                }
                else if (curName !== '') {
                    logError('as the last template has not been ended yet');
                }
                else {
                    this.log(`Began new template ${join(templatePath, spls[1])}`);
                    curName = spls[1];
                }
            }
            else if (line.startsWith('//endtemplate')) {
                if (spls.length !== 2) {
                    logError('as it\'s not a valid end template line (invalid space count)');
                }
                else if (spls[1] !== curName) {
                    logError(`as a end template line must end the last begin template line (found ${spls[1]}, wanted ${curName})`);
                }
                else {
                    this.log(`Parsed new template '${join(templatePath, curName)}'`);
                    this.templates.push([join(templatePath, curName), curTemplate]);
                    curTemplate = [];
                    curName = '';
                }
            }
            else {
                curTemplate.push(line);
            }
        }
    }

    closeLogger(): void {
        this.logger.dispose();
    }
}