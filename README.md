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

## Test Case Management

Shortcut: Ctrl+Alt+I
Command: `cp-tools.openInput`

Opens up a menu for manipulating test cases.  Test cases are divided into "test sets", and a single test set is used as input for program during execution.  While the cases themselves are stored in files, there is support for editing those cases directly in the display, and there is also a console for quick editing of test data.

Additionally, there are some extra features that help making navigating 

### Extra Features

Besides the console, there are some additional features to make manipulation and navigation easier:

- Pressing `ctrl+r` will reload the info of all test cases, in case one was modified
- Pressing `ctrl+s` while a test case is currently selected will save the info of that test case to files.
    - Also note that test cases automatically save when you switch from one to the next.  So be careful if you have unsaved changes!
- The `default` test set is not deletable.  This is done intentially to allow easy restoration from an invalid state (i.e. When a test set is selected that does not exist)
    - If the above type of error happens, simply go into the Options display panel and reset the `curTestSet` option, which will change it back to the default test set

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

CP Tools uses a separate webview for manipulating configuration data.  The UI should be relatively simple and self-exaplanatory to navigate.  Hope it's useful!

### Options List

TODO

## Additional Commands

- `cp-tools.removeTempFiles`
    - Some of the other features (i.e. Build and Run) generate temporary files.  This command automatically clears all of them in your workspace directory (which is where they're normally generated)

# Next Steps/TODO List

Any issue marked with **FIX** is a bug

- Number of test cases in execution by their test index (counting disabled cases)
    - Currently it's a bit unclear which cases are the ones actually being run
- Different checkers for comparing output and input
    - Support for custom checkers written in JS (use modules.export maybe?)
        - Also add some sample library checkers to make writing checkers easier
- Hacking panel (aka Stress testing/Edges cases)
- `copy` command for input display
- Input/Output preview for test data and execution panels
    - Not super high priority because I don't have many good ideas on how to do it without too much clutter at this moment
    - Priority will change if I do get an idea though
- Options display automatically reloads when the current test set is changed
- Make a better help page for the input display (inside the app, not here)
    - Not super high priority because the readme is intended to be a semi-tutorial
    - There are also plans to improve the readme :)
    - Small QoL update
- Adding support for interactors
    - The question is, how hard is it to code a separate interactor compared to coding the interactor straight into your solution
        - See [here](https://dmoj.ca/src/1954618) for an example
- `copy` command for input display
- Adding a "live" timer for the execution time of a judging case (not super pertinent as final time is what really matters)
    - Small QoL update
	