import * as vscode from 'vscode';
import * as fs from 'fs';
import { Options, parseConfig } from './options';
import { join } from 'path';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../undefinedutils';


const CONFIG_PATH = 'config.json';


interface Template {
    lines: string[];
    description: string;
}


export class TemplateParser {
    public templates: [string, Template][] = [];
    public logger: vscode.Terminal | undefined = undefined;
    public options: Options | undefined = undefined;

    constructor(context: vscode.ExtensionContext) {
        this.logger = vscode.window.createTerminal('Load Template Logger', join(context.extensionPath, 'out', 'template', 'shell.exe'));
        this.logger.sendText('@echo off');
        this.logger.show();
    }

    log(message: string, type: string) {
        if (isUndefined(this.logger)) {
            throw new Error('Logger undefined!');
        }
        this.logger.sendText(`${type} "${message.replace(/'/g, '\\\'')}"`);
    }

    info(message: string) { this.log(message, 'info'); }
    success(message: string) { this.log(message, 'succ'); }
    warning(message: string) { this.log(message, 'warn'); }
    error(message: string) { this.log(message, 'err'); }

    parseConfig(curPath: string) {
        this.options = parseConfig(join(curPath, CONFIG_PATH), this);
    }

    // Traverses a template folder for template files
    traverseFolder(curPath: string, templatePath: string = ''): void {
        if (isUndefined(this.options)) {
            throw new Error('Configuration not initialized!');
        }
        else if (this.options.ignorePaths.has(templatePath)) {
            this.warning(`Skipping folder '${templatePath}' as defined in the configuration!`);
        }

        for (const sub of fs.readdirSync(curPath)) {
            const adjPath = join(curPath, sub), stats = fs.lstatSync(adjPath);

            // console.log(`path: ${curPath}, templatePath: ${templatePath}, adjPath: ${adjPath}, isDir: ${stats.isDirectory()}`);

            if (stats.isDirectory()) {
                this.traverseFolder(adjPath, join(templatePath, sub));
            }
            else if (stats.isFile()) {
                this.parseFile(adjPath, templatePath);
            }
            else {
                this.error(`Skipping path '${adjPath}' as it's not a file or directory`);
            }
        }
    }

    // Parses a template file
    private parseFile(path: string, templatePath: string): void {
        if (errorIfUndefined(this.options, 'options became undefined again?').ignorePaths.has(templatePath)) {
            this.warning(`Skipping file '${templatePath}' as defined in the configuration!`);
        }

        let curTemplate: string[] = [], curName: string = '', curDescription: string = '';
        for (const line of fs.readFileSync(path).toString().split(/\r?\n/g)) {
            const logError = (message: string) => {
                // Lambda declaration to not override `this` variable
                this.error(`Skipping line '${line}' of path '${path}' ${message}`);
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
                    this.info(`Began new template '${join(templatePath, spls[1])}'`);
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
                    this.success(`Parsed new template '${join(templatePath, curName)}'`);
                    this.templates.push([join(templatePath, curName), {
                        lines: curTemplate,
                        description: curDescription
                    }]);
                    curTemplate = [];
                    curName = '';
                    curDescription = '';
                }
            }
            else if (line.startsWith('//description')) {
                if (spls.length === 1) {
                    logError('as there is no description argument!');
                }
                else if (curName === '') {
                    logError('as this is not within a template!');
                }
                else if (curDescription !== '') {
                    logError('as a description has already been given')
                }
                else {
                    curDescription = spls.slice(1).join(' ');
                }
            }
            else {
                curTemplate.push(line);
            }
        }
    }

    closeLogger(): void {
        if (!isUndefined(this.logger)) {
            this.logger.dispose();
        }
    }
}