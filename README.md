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
- open <in|out>: Opens the current selected test case (either input or output) (aka. o) 
- select <test set>: Selects the current test set (aka. sel, s)
- selectcase <test index>: Selects the current test case (in the curren test set) (aka. selcase, selc, sc)
- insert <test set>: Creates a new test set (aka. ins, i)
- insertcase <test index> [count=1]: Inserts [count] number of new test sets at the given index (in the current test set) (aka. inscase, insc, ic)
- delete <test set>: Deletes the test set (aka. del, d)
- deletecase <test index> [count=1]: Delete [count] number of new test sets at the given index (in the current test set) (aka. delcase, delc, dc)
- swap <test set> <other test set>: Swaps the test sets (aka. sw)
- swapcase <test index> <other test index>: Swaps the given test cases (of the current test set) (aka. swcase, swc)
- rename <old name> <new name>: Renames the given test set (aka. ren, r)
- pushcase [count=1]: Inserts [count] new test cases at the end (of the current test set) (aka. pcase, pc)
- enable <test index>: Enables the given test index (of the current test set) (aka. en)
- disable <test index>: Disables the given test index (of the current test set) (aka. dis)

## Code Templates

Command: `cp-tools.loadTemplates`

Converts a directory of code templates into VSCode snippets.

TODO

## Configuration

Shortcut: Ctrl+Alt+O
Command: `cp-tools.openOptions`

CP Tools uses a separate webview for manipulating configuration data.  The UI should be relatively self-explanatory.

## Additional Commands

- `cp-tools.removeTempFiles`
    - Some of the other features (i.e. Build and Run) generate temporary files.  This command automatically clears all of them in your workspace directory (which is where they're normally generated)

# Next Steps/TODO List

- Test case preview for the test data display
- `copy` command for input display
- Number of test cases in execution by their test index (counting disabled cases)
- Different checkers for comparing output and input
- Adding a "live" timer for the "time" of a judging case (not super pertinent)
- **FIX**: Support proper Ctrl+R (or another shortcut) reloading for the Test Data display
- **FIX**: Refractor Commands implementation
- **FIX**: Options display automatically reloads when the current test set is changed
- **FIX**: Improve readme
