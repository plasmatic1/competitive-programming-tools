import { DisplayInterface } from './displayInterface';
import { testManager, optionManager } from '../extension';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { CommandHandler, choiceArg, ArgType, intArg } from '../commandHandler';
import { getTempFile } from '../extUtils';

// tslint:disable: curly
export enum EventType {
    OpenCaseFile = 'openCaseFile', // Inbound: Opens a case file.  Parameters: key, index, isInput
    CaseCommand = 'caseCommand', // Inbound: A command was run.  Parameters: key (current test set), index (current test case), command (command) | Outbound: Responding to a command.  Parameters: response is a string
    UpdateStructure = 'updateStructure', // Inbound: Request for structure update. | Outbound: Structure update.  Parameters: { key: boolean[] }
    UpdateAll = 'updateAll', // Inbound: Request for everything update. | Outbound: Everything update.  Parameters: { cases: { key: Test[] }, curTestSet: string }
    UpdateTestCase = 'updateCase', // Inbound: Updates a test case.  Parameters: key, index, isInput, newData
    SelectTestSet = 'selectTestSet', // Inbound: Selects a test case (for running).  Parameters: event is a string (the case to select)
}

const testSetArg: ArgType = {
    isValid: (_, __, key) => testManager!.exists(key) ? null : `Test set '${key}' does not exist`,
    parse: (_, __, key) => key
};
const notTestSetArg: ArgType = { // Test set that doesn't exist
    isValid: (_, __, key) => testManager!.exists(key) ? `Test set '${key}' already exists` : null,
    parse: (_, __, key) => key
};
function testIndexArg(extendBy: number = 0): ArgType { // sometimes, you want to be able to input indexes "past the end" (i.e. when using insertCase to push a case at the end)
    return { 
        isValid: (key, _, index) => {
            if (isNaN(parseInt(index))) return `${index} is not a number`;
            const indexNum = parseInt(index);
            return 0 <= indexNum && indexNum < testManager!.get(key!).length + extendBy ? null : `Test index ${indexNum} out of range`;
        },
        parse: (_, __, arg) => parseInt(arg)
    };
}

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
            vscode.window.showInformationMessage(`Saved data of test set ${evt.key} case #${evt.index}`);
            this.emit({
                type: EventType.UpdateTestCase,
                event: evt
            });
        });
        this.on(EventType.SelectTestSet, evt => optionManager!.set('buildAndRun', 'curTestSet', evt));

        // Register commands

        // Open command
        this.commandHandler.registerCommand('open', (curKey, curIdx, inOrOut) => {
            testManager!.openCaseFile(curKey!, curIdx!, inOrOut === 'in');
            return null;
        }, [choiceArg('in', 'out')], true, true);

        // Insert commands
        this.commandHandler.registerCommand('insert', (_, __, key) => {
            testManager!.addSet(key);
            this.updateAll();
            return null;
        }, [notTestSetArg], false, false, ['ins', 'i']);
        this.commandHandler.registerCommand('insertcase', (curKey, curIndex, index, count) => {
            testManager!.insertCases(curKey!, index, count);
            this.updateAll(curKey, curIndex);
            return null;
        }, [testIndexArg(1), [intArg, 1]], true, false, ['inscase', 'insc', 'ic']);

        // Delete commands
        this.commandHandler.registerCommand('delete', (curKey, _, key) => {
            if (key === 'default') return 'Cannot delete default test set';
            testManager!.removeSet(key);

            if (curKey === key) this.updateAll('default', null); // If current test set was deleted
            else this.updateAll();
            return null;
        }, [testSetArg], false, false, ['del', 'd']);
        this.commandHandler.registerCommand('deletecase', (curKey, curIndex, index, count) => {
            const caseCount = testManager!.caseCount(curKey!);
            if (count > caseCount - index) return `Delete ${count} out of range`;
            testManager!.removeCases(curKey!, index, count);

            if (curIndex !== null && curIndex >= caseCount - count) this.updateAll(curKey, null); // If current test case was deleted
            else this.updateAll(curKey, curIndex);
            return null;
        }, [testIndexArg(), [intArg, 1]], true, false, ['delcase', 'delc', 'dc']);

        // Swap commands
        this.commandHandler.registerCommand('swap', (curKey, curIndex, key1, key2) => {
            if (key1 === key2) return 'Cannot swap same test sets';

            // Make temp files for key1
            const tm = testManager!, cc1 = tm.caseCount(key1), cc2 = tm.caseCount(key2);
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
            
            // Run updateAll, make sure to unselect test case if test case is now out of bounds
            if (curKey === key1 && curIndex !== null && curIndex >= tm.get(key1).length) this.updateAll(curKey, null);
            else this.updateAll();
            return null;
        }, [testSetArg, testSetArg], false, false, ['sw']);
        this.commandHandler.registerCommand('swapcase', (_curKey, _, index1, index2) => {
            if (index1 === index2) return 'Cannot swap same test cases';
            const tm = testManager!, curKey = _curKey!;

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
            const tmp = tm.get(curKey).disabled[index1];
            tm.get(curKey).disabled[index1] = tm.get(curKey).disabled[index2];
            tm.get(curKey).disabled[index1] = tmp;

            this.updateAll();
            return null;
        }, [testIndexArg(), testIndexArg()], true, false, ['swcase', 'swc']);

        // Push
        this.commandHandler.registerCommand('pushcase', (curKey, _, count) => {
            testManager!.insertCases(curKey!, testManager!.caseCount(curKey!), count);
            this.updateAll();
            return null;
        }, [[intArg, 1]], true, false, ['pcase', 'pc']);

        // Rename
        this.commandHandler.registerCommand('rename', (curKey, curIndex, key1, key2) => {
            if (key1 === key2) return 'Cannot rename same test sets';
            if (key1 === 'default') return 'Cannot rename default test set';
            
            // Move files
            const tm = testManager!, cc = tm.caseCount(key1);
            for (let i = 0; i < cc; i++) {
                fs.renameSync(tm.caseFilePath(key1, i, true), tm.caseFilePath(key2, i, true));
                fs.renameSync(tm.caseFilePath(key1, i, false), tm.caseFilePath(key2, i, false));
            }
            
            // Swap enabled/disabled arrays
            tm.testSets.set(key2, tm.get(key1));
            tm.testSets.delete(key1);
            
            if (curKey === key1) this.updateAll(key2, curIndex);
            else this.updateAll();
            return null;
        }, [testSetArg, notTestSetArg], false, false, ['ren', 'r']);

        // Enable/disable
        this.commandHandler.registerCommand('enable', (curKey, _, index) => {
            testManager!.enableCase(curKey!, index);
            this.updateAll();
            return null;
        }, [testIndexArg()], true, false, ['en']);
        this.commandHandler.registerCommand('disable', (curKey, _, index) => {
            testManager!.disableCase(curKey!, index);
            this.updateAll();
            return null;
        }, [testIndexArg()], true, false, ['dis']);
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
     * 
     * @param changeSelectedSet Optional, fill this parameter if you wish to change the current test set
     * @param changeSelectedIndex Optional, fill this parameter if you wish to change the current test index
     */
    updateAll(changeSelectedSet?: string | null, changeSelectedIndex?: number | null): void {
        let cases: any = {};
        console.log(testManager!.testSets);
        for (const [key, val] of testManager!.testSets.entries())
            cases[key] = val.disabled.map((disabled, index) => {
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
                curTestSet: changeSelectedSet,
                curTestIndex: changeSelectedIndex
            }
        });
    }
}
