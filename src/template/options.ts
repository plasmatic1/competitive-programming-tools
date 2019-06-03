import * as fs from 'fs';
import { TemplateParser } from './parser';
import { isUndefined } from 'util';
import { errorIfUndefined } from '../undefinedutils';

export class Options {
    public ignorePaths: Set<string> = new Set(['.git', '.vscode']);
    public replaceBackslashes: boolean = true;
}

const KEYS: string[] = Object.keys(new Options());
const __DEFAULT: Options = new Options();
const DEFAULTS: Map<string, any> = new Map(Object.entries(__DEFAULT));
const CHECK_FUNS: Map<string, (val: any) => boolean> = new Map([
    ['ignorePaths', Array.isArray],
    ['replaceBackslashes', x => typeof(x) === 'boolean']
]);

/**
 * Attempts to parse a config file.  The default configuration will be returned otherwise
 * @param path Path of the config gile
 * @param parser The current config parser.  Log information and errors will be sent to its logger
 * @returns The configuration (Options) object found
 */
export function parseConfig(path: string, parser: TemplateParser): Options {
    if (!fs.existsSync(path)) {
        parser.warning(`Config '${path}' does not exist! Using default options...`);
        return new Options();
    }
    else if (!fs.lstatSync(path).isFile()) {
        parser.warning(`Config '${path}' is not a file! Using default options...`);
        return new Options();
    }

    try {
        const config = JSON.parse(fs.readFileSync(path).toString());
        
        for (const key of KEYS) {
            if (isUndefined(config[key])) {
                config[key] = DEFAULTS.get(key);
                parser.warning(`Key '${key}' was not defined, using default value ${config[key]}`);
            }
            else if (!errorIfUndefined(CHECK_FUNS.get(key))(config[key])) {
                config[key] = DEFAULTS.get(key);
                parser.warning(`Key '${key}' was of the incorrect type, using default value ${config[key]}`);
            }
            else {
                parser.success(`Parsed key '${key}' with value '${config[key]}'`);
            }
        }

        config.ignorePaths = new Set(config.ignorePaths); // Convert array to set
        
        return config;
    }
    catch (e) {
        parser.warning(`Error while parsing config file: ${e.name}: ${e.message}, using default configuration`);
        return new Options();
    }
}