import { DisplayInterface, EventType } from "./displayInterface";
import { OptionManager } from "../options/options";
import { resetOptions, resetCategory, setOption } from "../options/optionsUtils";

/**
 * Event types for the optionsDisplayInterface
 * 
 * Inbound refers to: What the event type means when it pretains to an event coming from the webview
 * Outbound refers to: What the event type means when it pretains to an event going to the webview
 */
export enum OptionsEventTypes {
    Ready = 'ready', // Inbound: Display Interface is ready
    Initialize = 'initialize', // Inbound: N/A, Outbound: Initialization Information
    SetOption = 'setOption', // Inbound: Webview wants an option changed.  Outbound: An option has been changed and the value should be updated
    ResetOptions = 'resetOptions', // Inbound: Webview wants all options to be reset.  Outbound: N/A
    ResetCategory = 'resetCategory' // Inbound: Webview wants all options in a category to be reset.  Outbound: N/A
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
type AllOptionsInfo = { [key: string]: CategoryInfo }

export class OptionsDI {
    constructor(
        private readonly displayInterface: DisplayInterface,
        private readonly optionManager: OptionManager
    ) {
        // tslint:disable: curly
        this.displayInterface.on(EventType.Settings, event_ => {
            const { event, type } = event_;

            if (type === OptionsEventTypes.SetOption) {
                setOption(optionManager, event.category, event.key).then(newValue => {
                    this.displayInterface.emit({
                        type: EventType.Settings,
                        event: {
                            type: OptionsEventTypes.SetOption,
                            event: {
                                category: event.category,
                                key: event.key,
                                value: newValue
                            }
                        }
                    })
                });
            }
            else if (type === OptionsEventTypes.Ready) {
                this.displayInterface.emit({
                    type: EventType.Settings,
                    event: {
                        type: OptionsEventTypes.Initialize,
                        event: this.getAllOptionsInfo()
                    }
                });
            }
            else if (type === OptionsEventTypes.ResetOptions)
                resetOptions(this.optionManager);
            else if (type === OptionsEventTypes.ResetCategory)
                resetCategory(this.optionManager, event);
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
