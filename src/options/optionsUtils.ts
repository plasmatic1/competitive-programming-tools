import { OptionManager, OptionProperties } from "./options";
import { isUndefined } from "util";

/**
 * Resets all options
 * @param optionManager OptionManager instance to reset
 */
export function resetOptions(optionManager: OptionManager) {
    for (const category of optionManager.categories) {
        for (const [key, properties] of optionManager.optionsFor(category)) {
            optionManager.set(category, key, properties.defaultValue);
        }
    }
}

/**
 * Resets all options in a category
 * @param optionManager OptionManager instance to reset
 * @param categoryKey Category
 */
export function resetCategory(optionManager: OptionManager, categoryKey: string) {
    // tslint:disable-next-line: curly
    for (const [key, properties] of optionManager.optionsFor(categoryKey))
        optionManager.set(categoryKey, key, properties.defaultValue);
}

/**
 * Resets a single option
 * @param optionManager OptionManager instance to reset
 * @param categoryKey The category
 * @param optionKey The option
 */
export function resetOption(optionManager: OptionManager, categoryKey: string, optionKey: string) {
    optionManager.set(categoryKey, optionKey, optionManager.getDefault(categoryKey, optionKey));
}

/**
 * Prompts the user to set a new value for a configuration option.  The returned promise is resolved with the new value of the option once it is updated.
 * @param optionManager OptionManager instance to reset
 * @param categoryKey Category
 * @param optionKey Option key
 */
export async function setOption(optionManager: OptionManager, categoryKey: string, optionKey: string): Promise<any> {
    return new Promise((res, rej) => {
        let properties: OptionProperties = optionManager.optionProperties(categoryKey, optionKey);

        properties.setFunction().then((value) => {	
            if (!isUndefined(value)) {
                optionManager.set(categoryKey, optionKey, value);
                res(value);
            }
            // tslint:disable-next-line: curly
            else
                rej('Invalid input');
        });
    });
}
