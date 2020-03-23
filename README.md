# CP Tools

CP Tools is a helper extension for competitive programmers that use VSCode :)

## Build and Run (Execution)

Shortcut: Ctrl+Alt+B

Command: `cp-tools.buildAndRun`

Builds and runs the code on a user created set of test cases.  Output is displayed in a user friendly format, along with useful information such as exit status, execution time, memory used, etc.  The output can be directly viewed in the webview panel, but can also be converted to text form.  Additionally, expected output can be supplied, and the actual input will be compared against it (the extension also supports automatically diffing the actual and expected outputs).

_Note: it is recommended not to close the webview panel after running, as opening the webview itself takes some time and the extension reuses webview panels when running_

### Extra Features

There are some additional features to make manipulation and navigation easier:

Assuming a test case is selected (for looking at full info), pressing `a` will shift you back a test case, while pressing `d` will shift you forward.  You can also press `shift+a` to navigate to the first test case and `shift+d` to navigate to the last.

### Verdicts

- `Waiting`: Case is waiting to be judged
- `Judging`: Case is being judged
- `Skipped`: Case was skipped.  Either there was a fatal compile error or all cases were halted by the user
- `Correct`: Correct output
- `Maybe`: The test case didn't have an expected output, but the program had a zero exit code.  Your output could be wrong, but you would have to check it yourself
- `Incorrect`: Incorrect output
- `Timeout`: Program exceeded time limit.  However, note that the `Timeout` verdict is given anytime a program is killed with `SIGTERM`
- `Runtime Error`: Program threw some error (either threw a signal or had a non-zero exit code)
- `Internal Error`: An error occured that is unrelated to your solution.  This is usually an issue with a custom checker 

## Test Case Management

Shortcut: Ctrl+Alt+I

Command: `cp-tools.openInput`

Opens up a menu for manipulating test cases.  Test cases are divided into "test sets", and a single test set is used as input for program during execution.  While the cases themselves are stored in files, there is support for editing those cases directly in the display, and there is also a console for quick editing of test data.

Additionally, there are some extra features that help making navigating 

### Extra Features

Besides the console, there are some additional features to make manipulation and navigation easier:

- Pressing `ctrl+r` will reload the info of all test cases, in case one was modified
- Pressing `ctrl+s` while a test case is currently selected will save the info of that test case to files.
    - Also note that test cases automatically save when you switch from one to the next (in the same set)
- Individual test cases can be disabled, they will still be present, but won't be used for testing your program until they're reenabled.  This can be useful if you have some stress tests in your test set that you only want to run when 
- The `default` test set is not deletable.  This is done intentially to allow easy restoration from an invalid state (i.e. When a test set is selected that does not exist)
    - If the above type of error happens, simply go into the Options display panel and reset the `curTestSet` option, which will change it back to the default test set
- Custom checkers are also supported!

### Checker Types

- `identical`: Self-explanatory
- `identicalNormalized`: Identical but both the expected and actual output will be "normalized".  This include:
    - All CR and CRLF newlines will be converted to LF
    - Any whitespace on the ends will be trimmed
- `tokens`: Outputs are split by whitespace (multiple whitespaces in a row are treated the same as single whitespace) and the resulting arrays are compared.  This is also the default checker.
- `float:1e-4`: The same as `tokens` except each token is converted to a float and compared based on a precision of `1e-4` (two numbers are considered the same if their absolute difference is `<= 10^-4`).  It's worth noting that if any element in either the actual or expected output arrays is not a number, the checker returns `false`
- `float:1e-9`: The same as `float:1e-4` except the precision is `1e-9`
- `custom`: Custom checker.  A file must be selected for this type of checker

#### Custom Checkers

The file selected must meet the following criteria:

- Be `.js`
- Have a `check(input: string, output: string, expectedOutput: string, libraryFunctions: CheckerLibraryFunctions) => boolean` function declared in the file (NOT as `module.exports`).  See the `src/test/samples` folder of this repository for some examples
- An `Internal Error` verdict will be given if the checker throws an error

`CheckerLibraryFunctions` is an object with the following functions provided for your convenience:

- `normalizeOutput: (str: string) => string`: Normalizes the given string with the same rules as the `identicalNormalized` checker
- `tokenize: (str: string) => string[]`: Tokenizes the given string with the same rules as the 
- `arrayEquals: <T>(a: T[], b: T[]) => boolean`: Returns whether two arrays are equal
- `arrayEqualsFloat: (a: string[], b: string[], eps: number) => boolean`: Effectively does what the `float:1e-4` and `float:1e-9` checkers do, but you have to specify your own precision value (eps)

**Important note: Using `console.log` inside the `check` function will print to the VSCode developer console (developer tools)!**

**Important note #2: Sadly, `require()` doesn't work with the `check` function yet :(**

### Commands
- listcommands: Lists all commands
- open:
    - Usage: `open <in|out>`
    - Description: Opens the current selected test case (either input or output)
    - Aliases: `o`
- select:
    - Usage: `select <test set>`
    - Description: Sets the current test set in the display to be `<test set>`
    - Aliases: `sel`, `s`
- selectcase:
    - Usage: `selectcase <test index>`
    - Description Sets the current test case to be `<test index>` (in the curren test set)
    - Aliases: `selcase`, `selc`, `sc`
- insert:
    - Usage: `insert <test set>`
    - Description: Creates a new test set called `<test set>`
    - Aliases: `ins`, `i`
- insertcase:
    - Usage: `insertcase <test index> [count=1]`
    - Description: Inserts `[count]` number of new test sets at `<test index>` (in the current test set)
    - Aliases: `inscase`, `insc`, `ic`
- delete:
    - Usage: `delete <test set>`
    - Description: Deletes the test set `<test set>`
    - Aliases: `del`, `d`
- deletecase:
    - Usage: `deletecase <test index> [count=1]`
    - Description: Delete [count] number of new test sets at `<test index>` (in the current test set)
    - Aliases: `delcase`, `delc`, `dc`
- swap:
    - Usage: `swap <set 1> <set 2>`
    - Description: Swaps the test sets `<set 1>` and `<set 2>`
    - Aliases: `sw`
- swapcase:
    - Usage: `swapcase <index 1> <index 2>`
    - Description: Swaps the test cases `<index 1>` and `<index 2>` (of the current test set)
    - Aliases: `swcase`, `swc`
- rename:
    - Usage: `rename <old name> <new name>`
    - Description: Renames the test set `<old name>` to `<new name>`
    - Aliases: `ren`, `r`
- pushcase:
    - Usage: `pushcase [count=1]`
    - Description: Inserts `[count]` new test cases at the end (of the current test set)
    - Aliases: `pcase`, `pc`
- enable:
    - Usage: `enable <test index>`
    - Description: Enables the test case `<test index>` (of the current test set)
    - Aliases: `en`
- disable:
    - Usage: `disable <test index>`
    - Description: Disables the test case `<test index>` (of the current test set)
    - Aliases: `dis`

## Code Templates

Command: `cp-tools.loadTemplates`

Converts a directory of code templates into VSCode snippets.  While all files are scanned for templates by default, it can be configured to 

### Template Formatting

For part of a file to be considered a template, it must have the following comments:

- `//begintemplate <template name>` before the template
- `//endtemplate` <template name> after the template
- (Optionally) `//description <description>` for a description

### Template Parse Configuration

Add a `config.json` file in the root directory of your templates... TODO

## Configuration

Shortcut: Ctrl+Alt+O

Command: `cp-tools.openOptions`

CP Tools uses a separate webview for manipulating configuration data.  The UI should be relatively simple and self-exaplanatory to navigate.  Hope it's useful!

### Options List

TODO

## Additional Commands

- `cp-tools.removeTempFiles`
    - Some of the other features (i.e. Build and Run) generate temporary files.  This command automatically clears all of them in your workspace directory (which is where they're normally generated)

# Next Steps/TODO List

Any issue marked with **FIX** is a bug

- `copy` command for input display
- Input/Output preview for test data and execution panels
    - Not super high priority because I don't have many good ideas on how to do it without too much clutter at this moment
    - Priority will change if I do get an idea though
- Improve readme
- Parsing test set from single text file (have to invent some kind of format)
- Adding support for interactors
    - The question is, how hard is it to code a separate interactor compared to coding the interactor straight into your solution
        - See [here](https://dmoj.ca/src/1954618) for an example
- Adding a "live" timer for the execution time of a judging case (not super pertinent as final time is what really matters)
    - Small QoL update
- Options display automatically reloads when the current test set is changed
    - It's not like this really matters at all, since the only time you use the options pane to change the current test set is when you're resetting it from an error state
    - Very small QoL update

- **FIX**: When executing, sometimes the output panel will stay empty and nothing will be output.  I think this is due to the extension host sending events before the webview is ready to accept them.  Currently, it's a pretty low impact bug seeing as it only happens once per session (of practice) (since webviews are reused), but it's still a bit annoying (and possibly confusing too)
