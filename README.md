# cp-tools (Competitive Programming Tools)

A set of tools to assist with Competitive Programming

## Features

Easy build and run

### Supported Languages

* **C++:** Compiled using the `g++` command, exact specifications are shown below.  The `g++` command should be accessible from the command prompt.
* **Python:** Interpreted using the `py` command in the format `py <file name>`.  The `py` command should be accessible from the command prompt

## Commands

* **Build and Run (cp-tools.buildAndRun):** Compiles and runs the current open file on a set of predetermined test data.  See below in the configuration options for more information
* **Open Input File (cp-tools.openInputFile):** Opens the input file used to supply input for the `cp-tools.buildAndRun` command
* **Edit Option (cp-tools.editOption):** Edit a configuration option
* **Reset Category (cp-tools.resetCategory):** Reset a configuration category
* **Reset Options (cp-tools.resetOptions):** Resets all configuration options to their default values

## Configuration Options

* **Build and Run (buildAndRun):** Configuration Options used by the `cp-tools.buildAndRun` command
    * **Input File (buildAndRun.inputFile):** Path to the input file used to supply input for the `cp-tools.buildAndRun` command
    * **Case Delimeter (buildAndRun.caseDelimeter):** In the input file, test cases are separated by a case delimiter, which is decided by this config option.  See below for an example
    * **Timeout (buildAndRun.timeout):** If a program executed by the `cp-tools.buildAndRun` command runs for too long, it will be killed.  The amount of time to wait before manually killing the program is determined by this configuration option.  The time is given in milliseconds.
    * **Sample Rate (buildAndRun.memSample):** Controls how quickly (time and) memory usage is sampled while the program is running.  The time is given in milliseconds.
    * **Character Limit (buildAndRun.charLimit):** The display of the `stdout` and `stderr` streams will be truncated to the value specified by this option to prevent lag.
    * **Reuse Webview (buildAndRun.reuseWebviews):** Normally when the `cp-tools.buildAndRun` command is executed, a new Webview Panel is created to display output.  By setting this option to `true` (or `Yes`), the command will now reuse existing Webviews for displaying output.  Additionally, the output display has a link on the bottom that will force VSCode to not reuse the Webview when clicked, which which for preserving output from previous runs of your program.
* **Compiler/Interpreter Arguments (compilerArgs):** Additional arguments used by the compilers and interpreters when running or compiling a program
    * **C++ (cpp):** The arguments used by the C++ compiler.  Assuming that the option value is `<args>`, the command `g++ -o <executable> <pathToOpenFile> <args>`.  Note that `g++` should be accesible to the command prompt for this to be able to compile properly.

## Examples

### Case Delimeters

If the `buildAndRun.caseDelimeter` option has the value `---` and the contents of our input file is:

```
input 1
---input 2
---input 3
```

There would be three separate cases with these respective inputs: `input 1`, `input 2`, and `input 3`.

## Installation

1. Install `node.js`
2. Install the `vsce` package (`npm install -g vsce`)
3. Clone this repository and open a command promopt in the home folder of the repository
4. Run the command `vsce package` to pack the extension.  Note that the modules being depended on may need to be installed first.  If that is the case, simply run the command `npm install`
5. Run the command `code --install-extension <path to .vsix file generated>`

## Todo List

* **Character Limit for output (so things dont get so laggy) IMPORTANT**
* Some cool code template stuff (not sure how useful this would be)
    * Command: Load Templates: Select a template folder and imports all of the templates found in that folder by overwriting the `snippets.json` file in the `.vscode` directory
    * Command: Pack Templates: Select a template folder and packages it into a single file for transport
    * Command: Unpack Templates: Unpacks a template file back into a folder
* Better UI
* Interactive stuff
* Performance
    * Cache the vue.js library to allow for offline use
    * Somehow make g++ somehow run in the background so that loading becomes like instant
* Add more languages
* Become less awkward
