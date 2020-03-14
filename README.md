# CP Tools

CP Tools is a helper extension for competitive programmers that use VSCode :)

## Build and Run (Execution)

Shortcut: Ctrl+Alt+B
Command: `cp-tools.buildAndRun`

Builds and runs the code on a user created set of test cases.  Output is displayed in a user friendly format, along with useful information such as exit status, execution time, memory used, etc.  The output can be directly viewed in the webview panel, but can also be converted to text form.  Additionally, expected output can be supplied, and the actual input will be compared against it (the extension also supports automatically diffing the actual and expected outputs).

_Note: it is recommended not to close the webview panel after running, as opening the webview itself takes some time and the extension reuses webview panels when running_

## Test Case Management

Shortcut: Ctrl+Alt+I
Command: `cp-tools.openInput`

Opens up a menu for manipulating test cases.  Test cases are divided into "test sets", and a single test set is used as input for program during execution.  While the cases themselves are stored in files, there is support for editing those cases directly in the display, and there is also a console for quick editing of test data.

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

Converts a directory of code templates into VSCode snippets.

TODO

## Configuration

Shortcut: Ctrl+Alt+O
Command: `cp-tools.openOptions`

CP Tools uses a separate webview for manipulating configuration data.  The UI should be relatively self-explanatory.

### Options List

TODO

## Additional Commands

- `cp-tools.removeTempFiles`
    - Some of the other features (i.e. Build and Run) generate temporary files.  This command automatically clears all of them in your workspace directory (which is where they're normally generated)

# Next Steps/TODO List

Any issue marked with **FIX** is a bug

- Test case preview for the test data display
- `copy` command for input display
- Different checkers for comparing output and input
- "Hacking" panel
- Number of test cases in execution by their test index (counting disabled cases)
- Input/Output preview for test data and execution panels
- Adding a "live" timer for the "time" of a judging case (not super pertinent)
- **FIX**: Fix bug: renaming the default test set shouldn't be possible
- **FIX**: Fix bug: attempting to delete the currently selected test case crashes input display.  Fix by resetting the selected index if it is deleted/not allowing deletion of selected case
- **FIX**: Fix bug: attempting to rename the currently selected test set crashes input display
- **FIX**: Fix bug: attempting to swap test sets when the current selected case has a higher index than the size of the other set, a crash happens
    - Idea: updateAll should have force removeAll
    - Extension: This would also apply to deleting the currently selected test set 
- **FIX**: Fix bug: if expected output is empty (undefined), then nothing is set for it in the output display panel
    - Idea: Empty expected output should be set as `null` instead of `undefined`.  It is not only more suitable but it's also easier to deal with given the nature of javascript
- **FIX**: Fix bug: multiline compile errors not displaying properly
- **FIX**: Fix bug: multiline things in general not displaying properly
- **FIX**: When making new test cases in a test set, testSet.json shows that the new elements are inserted with `null` instead of `true` or `false`.  Currently, this is a non-issue but may be problematic in the future
- **FIX**: Refractor Commands implementation
- **FIX**: Options display automatically reloads when the current test set is changed
- **FIX**: Improve readme
- Make a better help page for the input display (inside the app, not here)
