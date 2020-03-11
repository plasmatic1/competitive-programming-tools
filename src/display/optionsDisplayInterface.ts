import { DisplayInterface } from "./displayInterface";
import { OptionManager } from "../options/options";
import { resetOptions, resetCategory, resetOption, setOption } from "../options/optionsUtils";
import * as vscode from 'vscode';

/**
 * Event types for the optionsDisplayInterface
 * 
 * Inbound refers to: What the event type means when it pretains to an event coming from the webview
 * Outbound refers to: What the event type means when it pretains to an event going to the webview
 */
export enum EventType {
    Ready = 'ready', // Inbound: Display Interface is ready
    Initialize = 'initialize', // Inbound: N/A, Outbound: Initialization Information
    SetOption = 'setOption', // Inbound: Webview wants an option changed.  Outbound: An option has been changed and the value should be updated
    ResetOptions = 'resetOptions', // Inbound: Webview wants all options to be reset.  Outbound: N/A
    ResetCategory = 'resetCategory', // Inbound: Webview wants all options in a category to be reset.  Outbound: N/A
    ResetOption = 'resetOption' // Inbound: Webview wants a single option to be reset.  Outbound: N/A
}

/**
 * Object class that contains all of the information required for one option
 */
export interface OptionInfo {
    label: string;
    description: string;
    type: string;
    value: any;
}

/**
 * Object class that contains all of the information required for one category
 */
export interface CategoryInfo {
    label: string;
    description: string;
    options: { [key: string]: OptionInfo };
}

/**
 * General Options Info
 */
type AllOptionsInfo = { [key: string]: CategoryInfo };

export class OptionsDI extends DisplayInterface {
    constructor(
        context: vscode.ExtensionContext,
        private readonly optionManager: OptionManager
    ) {
        super('options.html', 'CP Tools Options', context);
        // tslint:disable: curly
        this.on(EventType.SetOption, evt => {
            setOption(optionManager, evt.category, evt.key).then(newValue => {
                this.sendSetOptionEvent(evt.category, evt.key, newValue);
            }).catch(err => vscode.window.showErrorMessage(`Error while setting option ${evt.category}.${evt.key}: ${err}`));
        });
        this.on(EventType.Ready, _ => this.sendInitalizeEvent());
        this.on(EventType.ResetOptions, _ => {
            resetOptions(this.optionManager);
            this.sendInitalizeEvent(); // Might as well just reset the whole UI at this point
        });
        this.on(EventType.ResetCategory, evt => {
            resetCategory(this.optionManager, evt);
            for (const [ key, _ ] of this.optionManager.optionsFor(evt))
                this.sendSetOptionEvent(evt, key, this.optionManager.getDefault(evt, key));
        });
        this.on(EventType.ResetOption, evt => {
            resetOption(this.optionManager, evt.category, evt.key);
            this.sendSetOptionEvent(evt.category, evt.key, this.optionManager.getDefault(evt.category, evt.key));
        });
    }

    /**
     * Sends a 'setOption' (UI update) event to the webview
     * @param categoryKey The category
     * @param optionKey The option
     * @param value The new value
     */
    sendSetOptionEvent(categoryKey: string, optionKey: string, value: any) {
        this.emit({
            type: EventType.SetOption,
            event: {
                category: categoryKey,
                key: optionKey,
                value: value
            }
        });
    }

    /**
     * Sends an 'initialize' event to the webview.
     */
    sendInitalizeEvent() {
        this.emit({
            type: EventType.Initialize,
            event: this.getAllOptionsInfo()
        });
    }

    /**
     * Returns information about all config options
     */
    getAllOptionsInfo(): AllOptionsInfo {
        let ret: AllOptionsInfo = {};

        for (const categoryKey of this.optionManager.categories) {
            let options: { [key: string]: OptionInfo } = {};
            for (const [key, option] of this.optionManager.optionsFor(categoryKey)) {
                const { label, description, type } = option;
                options[key] = { label, description, type, value: this.optionManager.get(categoryKey, key) };
            }

            const { label, description } = this.optionManager.categoryProperties(categoryKey);
            ret[categoryKey] = { label, description, options };
        }

        return ret;
    }
}
