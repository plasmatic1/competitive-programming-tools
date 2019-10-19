import * as vscode from 'vscode';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../extUtils';
import { OPTIONS, CATEGORY_PROPERTIES } from './optionsList';

export interface OptionProperties {
    defaultValue: string | number | boolean | undefined; // Default value for this option
    label: string; // Label for this option
    description: string; // Description for this option
    type: string; // Type of this option
    setFunction: () => Thenable<string | number | boolean | undefined>; // Function called to set this option.  Return `undefined` if the set attempt failed
}

export interface CategoryProperties {
    label: string;
    description: string;
}

// ---------------------------------------------------------------------------
// Class to export
// ---------------------------------------------------------------------------

export class OptionManager {
    constructor(
        private extensionContext: vscode.ExtensionContext
    ) {}

    /**
     * Gets the properties for a config option (<category>.<option>)
     * @param category Category
     * @param key Option key
     */
    private getProperties(category: string, key: string): OptionProperties {
        return errorIfUndefined(errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').get(key), 'Invalid key!');
    }

    /**
     * Get the default value for a config option
     * @param category Category
     * @param key Option key
     */
    getDefault(category: string, key: string): any {
        return this.getProperties(category, key).defaultValue;
    }

    /**
     * Gets the current value for a config option, or the default if none currently exists
     * @param category Category
     * @param key Option key
     */
    get(category: string, key: string): any {
        const val = this.extensionContext.workspaceState.get(key);
        if (isUndefined(val)) {
            return this.getDefault(category, key);
        }
        return val;
    }

    /**
     * Sets the value of a config option
     * @param category Category
     * @param key Option key
     * @param value New value
     */
    set(category: string, key: string, value: any): void {
        if (typeof value !== this.getProperties(category, key).type) {
            throw new Error('Incorrect type!');
        }
        this.extensionContext.workspaceState.update(key, value);
    }

    /**
     * Returns a list of all options in that category
     * @param category Category
     * @returns A [string, OptionProperties][] 
     */
    optionsFor(category: string): [string, OptionProperties][] {
        return [...errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').entries()];
    }

    /**
     * Gets the Option Properties for a sepcific option
     * @param category Category
     * @param key Option key
     */
    optionProperties(category: string, key: string): OptionProperties {
        return errorIfUndefined(errorIfUndefined(OPTIONS.get(category), 'Invalid Category!').get(key), 'Invalid Key!');
    }

    /**
     * Gets the category properties for a sepcific category
     * @param category Category
     */
    categoryProperties(category: string): CategoryProperties {
        return errorIfUndefined(CATEGORY_PROPERTIES.get(category), 'Invalid Category!');
    }

    /**
     * A list of all categories
     */
    get categories(): string[] {
        return [...OPTIONS.keys()];
    }
}
