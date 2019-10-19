import { OptionManager } from "./options";

/**
 * Resets all options
 * @param optionManager OptionManager instance to reset
 */
export function resetOptions(optionManager: OptionManager) {
    // TODO: Implement
}

/**
 * Resets all options in a category
 * @param optionManager OptionManager instance to reset
 * @param categoryKey Category
 */
export function resetCategory(optionManager: OptionManager, categoryKey: string) {
    // TODO: Implement
}

/**
 * Prompts the user to set a new value for a configuration option.  The returned promise is resolved with the new value of the option once it is updated.
 * @param optionManager OptionManager instance to reset
 * @param categoryKey Category
 * @param optionKey Option key
 */
export async function setOption(optionManager: OptionManager, categoryKey: string, optionKey: string): Promise<any> {
    // TODO: Implement
}
