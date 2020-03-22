export const DEFAULT_CHECKER = 'identicalNormalizeWhitespace';

export interface CheckerLibraryFunctions {

}

export type CheckerFunction = (input: string, output: string, expectedOutput: string, libraryFunctions: CheckerLibraryFunctions) => boolean;


