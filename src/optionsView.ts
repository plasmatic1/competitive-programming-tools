import * as vscode from 'vscode';

export class OptionsNodeProvider implements vscode.TreeDataProvider<ConfigOption> {
    onDidChangeTreeData?: vscode.Event<ConfigOption | null | undefined> | undefined = undefined;   
    
    constructor() {
        
    }
    
    getTreeItem(element: ConfigOption): vscode.TreeItem | Thenable<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }
    
    getChildren(element?: ConfigOption | undefined): vscode.ProviderResult<ConfigOption[]> {
        throw new Error("Method not implemented.");
    }
}

export class ConfigOption extends vscode.TreeItem {
    key: String;
    value: String;

    constructor(key: string, value: any, collapsedState: vscode.TreeItemCollapsibleState) {
        super((String)(key.split('.').pop()), collapsedState);
        this.key = key;
        this.value = value;
    }
}