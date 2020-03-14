import { DisplayInterface } from './displayInterface';
import { testManager, optionManager } from '../extension';
import * as fs from 'fs';
import * as vscode from 'vscode';
import CommandHandler from '../commandHandler';
import { getTempFile } from '../extUtils';

export enum EventType {
    OpenCaseFile = 'openCaseFile', // Inbound: Opens a case file.  Parameters: key, index, isInput
    CaseCommand = 'caseCommand', // Inbound: A command was run.  Parameters: key (current test set), index (current test case), command (command) | Outbound: Responding to a command.  Parameters: response is a string
    UpdateStructure = 'updateStructure', // Inbound: Request for structure update. | Outbound: Structure update.  Parameters: { key: boolean[] }
    UpdateAll = 'updateAll', // Inbound: Request for everything update. | Outbound: Everything update.  Parameters: { cases: { key: Test[] }, curTestSet: string }
    UpdateTestCase = 'updateCase', // Inbound: Updates a test case.  Parameters: key, index, isInput, newData
    SelectTestSet = 'selectTestSet', // Inbound: Selects a test case (for running).  Parameters: event is a string (the case to select)
}

// tslint:disable: curly
export class InputDI extends DisplayInterface {
    commandHandler: CommandHandler;

    constructor(context: vscode.ExtensionContext) {
        super('input.html', 'Test Cases', context);

        // Command handler
        this.commandHandler = new CommandHandler(
            command => this.emit({ type: EventType.CaseCommand, event: `Invalid command ${command}` }),
            message => this.emit({ type: EventType.CaseCommand, event: message }));

        // Handle all case events
        this.on(EventType.OpenCaseFile, evt => testManager!.openCaseFile(evt.key, evt.index, evt.isInput));
        this.on(EventType.CaseCommand, evt => this.commandHandler.dispatchCommand(evt.command, evt.key, evt.index));
        this.on(EventType.UpdateStructure, _ => this.updateStructure());
        this.on(EventType.UpdateAll, _ => this.updateAll());
        this.on(EventType.UpdateTestCase, evt => {
            fs.writeFileSync(testManager!.caseFilePath(evt.key, evt.index, evt.isInput), evt.newData);
            vscode.window.showInformationMessage(`Saved case data to test set ${evt.key}, case #${evt.index}`);
            this.emit({
                type: EventType.UpdateTestCase,
                event: evt
            });
        });
        this.on(EventType.SelectTestSet, evt => optionManager!.set('buildAndRun', 'curTestSet', evt));

        // Register commands
        this.commandHandler.registerCommand('open', (curKey, curIdx, inOrOut) => {
            const tm = testManager!;
            if (!tm.exists(curKey)) return `Test set '${curKey}' does not exist`;
            if (curIdx < 0 || curIdx > tm.caseCount(curKey)) return `Index ${curIdx} out of range`;
            if (inOrOut !== 'in' && inOrOut !== 'out') return `Please either select in(put) or out(put), not ${inOrOut}`;

            tm.openCaseFile(curKey, curIdx, inOrOut === 'in');
            return null;
        });

        // Insert commands
        this.commandHandler.registerCommand('insert', (_, __, key) => {
            const tm = testManager!;
            if (tm.exists(key)) return `Test set '${key}' already exists`;

            tm.addSet(key);

            this.updateAll();
            return null;
        }, ['ins', 'i']);
        this.commandHandler.registerCommand('insertcase', (curKey, _, index, count = 1) => {
            const tm = testManager!;
            if (isNaN(parseInt(index))) return `${index} is not a number`; index = parseInt(index);
            if (isNaN(parseInt(count))) return `${count} is not a number`; count = parseInt(count);
            if (index < 0 || index > tm.caseCount(curKey)) return `Index ${index} out of range`;

            tm.insertCases(curKey, index, count);

            this.updateAll();
            return null;
        }, ['inscase', 'insc', 'ic']);

        // Delete commands
        this.commandHandler.registerCommand('delete', (_, __, key) => {
            const tm = testManager!;
            if (!tm.exists(key)) return `Test set '${key}' does not exist`;
            if (optionManager!.get('buildAndRun', 'curTestSet') === key) return `Cannot delete currently selected test set ${key}`;

            tm.removeSet(key);
            this.updateAll();
            
            return null;
        }, ['del', 'd']);
        this.commandHandler.registerCommand('deletecase', (curKey, _, index, count = 1) => {
            const tm = testManager!;
            if (isNaN(parseInt(index))) return `${index} is not a number`; index = parseInt(index);
            if (isNaN(parseInt(count))) return `${count} is not a number`; count = parseInt(count);
            const caseCount = tm.caseCount(curKey);
            if (index < 0 || index > caseCount) return `Index ${index} out of bounds`;
            if (count > caseCount - index) return `Delete ${count} out of range`;

            tm.removeCases(curKey, index, count);

            this.updateAll();
            return null;
        }, ['delcase', 'delc', 'dc']);

        // Swap commands
        this.commandHandler.registerCommand('swap', (_, __, key1, key2) => {
            const tm = testManager!;
            if (!tm.exists(key1)) return `Test set '${key1}' does not exist`;
            if (!tm.exists(key2)) return `Test set '${key2}' does not exist`;
            
            // Make temp files for key1
            const cc1 = tm.caseCount(key1), cc2 = tm.caseCount(key2);
            const tmpInput = [], tmpOutput = [];
            for (let i = 0; i < cc1; i++) {
                const tmpPathInput = getTempFile();
                fs.renameSync(tm.caseFilePath(key1, i, true), tmpPathInput);
                const tmpPathOutput = getTempFile();
                fs.renameSync(tm.caseFilePath(key1, i, false), tmpPathOutput);
                tmpInput.push(tmpPathInput); tmpOutput.push(tmpPathOutput);
            }
            // Move key2 to key1
            for (let i = 0; i < cc2; i++) {
                fs.renameSync(tm.caseFilePath(key2, i, true), tm.caseFilePath(key1, i, true));
                fs.renameSync(tm.caseFilePath(key2, i, false), tm.caseFilePath(key1, i, false));
            }
            // Move tmp to key1
            for (let i = 0; i < cc1; i++) {
                fs.renameSync(tmpInput[i], tm.caseFilePath(key2, i, true));
                fs.renameSync(tmpOutput[i], tm.caseFilePath(key2, i, false));
            }
            
            // Swap enabled/disabled arrays
            const tmp = tm.get(key1); 
            tm.testSets.set(key1, tm.get(key2));
            tm.testSets.set(key2, tmp);
            
            this.updateAll();
            return null;
        }, ['sw']);
        this.commandHandler.registerCommand('swapcase', (curKey, _, index1, index2) => {
            const tm = testManager!;
            if (isNaN(parseInt(index1))) return `${index1} is not a number`; index1 = parseInt(index1);
            if (isNaN(parseInt(index2))) return `${index2} is not a number`; index2 = parseInt(index2);
            const caseCount = tm.caseCount(curKey);
            if (index1 < 0 || index1 > caseCount) return `Index ${index1} out of bounds`;
            if (index2 < 0 || index2 > caseCount) return `Index ${index2} out of bounds`;

            // move index1 to tmp
            const tmpInput = getTempFile();
            fs.renameSync(tm.caseFilePath(curKey, index1, true), tmpInput);
            const tmpOutput = getTempFile();
            fs.renameSync(tm.caseFilePath(curKey, index1, false), tmpOutput);
            // move index2 to index1
            fs.renameSync(tm.caseFilePath(curKey, index2, true), tm.caseFilePath(curKey, index1, true));
            fs.renameSync(tm.caseFilePath(curKey, index2, false), tm.caseFilePath(curKey, index1, false));
            // move tmp to index1
            fs.renameSync(tmpInput, tm.caseFilePath(curKey, index2, true));
            fs.renameSync(tmpOutput, tm.caseFilePath(curKey, index2, false));

            // Swap enabled/disabled
            const tmp = tm.get(curKey)[index1];
            tm.get(curKey)[index1] = tm.get(curKey)[index2];
            tm.get(curKey)[index1] = tmp;

            this.updateAll();
            return null;
        }, ['swcase', 'swc']);

        // Push
        this.commandHandler.registerCommand('pushcase', (curKey, _, count = 1) => {
            const tm = testManager!;
            if (isNaN(parseInt(count))) return `${count} is not a number`; count = parseInt(count);

            tm.insertCases(curKey, tm.caseCount(curKey), count);

            this.updateAll();
            return null;
        }, ['pcase', 'pc']);

        // Rename
        this.commandHandler.registerCommand('rename', (_, __, key1, key2) => {
            const tm = testManager!;
            if (!tm.exists(key1)) return `Test set '${key1}' does not exist`;
            if (tm.exists(key2)) return `Test set '${key2}' already exists`;
            
            // Move files
            const cc = tm.caseCount(key1);
            for (let i = 0; i < cc; i++) {
                fs.renameSync(tm.caseFilePath(key1, i, true), tm.caseFilePath(key2, i, true));
                fs.renameSync(tm.caseFilePath(key1, i, false), tm.caseFilePath(key2, i, false));
            }
            
            // Swap enabled/disabled arrays
            tm.testSets.set(key2, tm.get(key1));
            tm.testSets.delete(key1);
            
            this.updateAll();
            return null;
        }, ['ren', 'r']);

        // Enable/disable
        this.commandHandler.registerCommand('enable', (curKey, _, index) => {
            const tm = testManager!;
            if (isNaN(parseInt(index))) return `${index} is not a number`; index = parseInt(index);
            const caseCount = tm.caseCount(curKey);
            if (index < 0 || index > caseCount) return `Index ${index} out of bounds`;

            tm.enableCase(curKey, index);

            this.updateAll();
            return null;
        }, ['en']);
        this.commandHandler.registerCommand('disable', (curKey, _, index) => {
            const tm = testManager!;
            if (isNaN(parseInt(index))) return `${index} is not a number`; index = parseInt(index);
            const caseCount = tm.caseCount(curKey);
            if (index < 0 || index > caseCount) return `Index ${index} out of bounds`;

            tm.disableCase(curKey, index);

            this.updateAll();
            return null;
        }, ['dis']);
    }

    /**
     * Updates the "structure" of the test sets.  This means everything except for the test data itself
     */
    updateStructure(): void {
        this.emit({
            type: EventType.UpdateStructure,
            event: testManager!.getCaseStructure()
        });
    }

    /**
     * Updates everything.
     */
    updateAll(): void {
        let cases: any = {};
        for (const [key, val] of testManager!.testSets.entries())
            cases[key] = val.map((disabled, index) => {
                return {
                    index,
                    disabled,
                    input: testManager!.getInput(key, index),
                    output: testManager!.getOutput(key, index)
                };
            });
        this.emit({
            type: EventType.UpdateAll,
            event: {
                cases,
                curTestSet: optionManager!.get('buildAndRun', 'curTestSet')
            }
        });
    }
}
