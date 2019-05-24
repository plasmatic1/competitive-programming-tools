import * as vscode from 'vscode';
import { optionManager } from './extension';
import { OptionProperties } from './options';
import * as path from 'path';

export class OptionsNodeProvider implements vscode.TreeDataProvider<OptionNode> {
    private changeEmitter: vscode.EventEmitter<OptionNode | undefined> = new vscode.EventEmitter<OptionNode | undefined>();
    onDidChangeTreeData?: vscode.Event<OptionNode | null | undefined> | undefined = this.changeEmitter.event;   
    
    constructor() {
        
    }

    refresh(): void {
        this.changeEmitter.fire();
    }
    
    getTreeItem(element: OptionNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    
    getChildren(element?: OptionNode | undefined): vscode.ProviderResult<OptionNode[]> {
        if (element) {
            return [];
        } else {
            return optionManager().entries.map(([key, properties]) => new OptionNode(key, properties));
        }
    }
}

export class OptionNode extends vscode.TreeItem {
    constructor(
        public readonly key: string, public readonly properties: OptionProperties) {
        super(properties.label + ': ', vscode.TreeItemCollapsibleState.None);
    }

    get description(): string {
        return this.value.toString();
    }

    get value(): string | number {
        return optionManager().get(this.key);
    }

    get tooltip(): string {
        return this.properties.description;
    }

    get iconPath(): string {
        return path.join(__filename, '..', '..', 'icons', 'types', `${this.properties.type}.svg`);
    }
}