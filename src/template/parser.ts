import * as vscode from 'vscode';
import * as fs from 'fs';
import { Options, parseConfig } from './options';
import { join } from 'path';
import { Logger } from './logger';


const CONFIG_PATH = 'config.json';


interface Template {
    lines: string[];
    description: string;
}


export class TemplateParser {
    public templates: [string, Template][] = [];
    public logger: Logger;
    public options: Options;
    public beginPath: string;

    constructor(context: vscode.ExtensionContext, beginPath: string) {
        this.logger = new Logger(context);
        this.beginPath = beginPath;
        this.options = parseConfig(join(this.beginPath, CONFIG_PATH), this);
    }

    info(text: string) { this.logger.log('info', text); }
    success(text: string) { this.logger.log('success', text); }
    warning(text: string) { this.logger.log('warning', text); }
    error(text: string) { this.logger.log('error', text); }

    async waitForInit() {
        return this.logger.waitForInit();
    }

    // Traverses a template folder for template files
    traverseFolder(curPath: string = this.beginPath, templatePath: string = ''): void {
        if (this.options.ignorePaths.has(templatePath)) {
            this.warning(`Skipping folder '${templatePath}' as defined in the configuration! (ignorePaths = ${this.setToString(this.options.ignorePaths)})`);
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

    private setToString<T>(set: Set<T>, delim: string = ', '): string {
        return '[' + Array.from(set.entries()).map(el => el[0]).join(delim) + ']';
    }

    // Parses a template file
    private parseFile(path: string, templatePath: string): void {
        if (this.options.ignorePaths.has(templatePath)) {
            this.warning(`Skipping file '${templatePath}' as defined in the configuration! (ignorePaths = ${this.setToString(this.options.ignorePaths)})`);
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
                    curTemplate = [];
                    curDescription = '';
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
                    logError('as a description has already been given');
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
        this.logger.dispose();
    }
}