# cp-tools (Competitive Programming Tools)

A set of tools to assist with Competitive Programming

## Features

### Build and Run

The build and run command allows you to quickly run a single file on a set of predefined inputs that are specified though the configuration options.  Furthermore, it will also display basic stats such as the exit code or termination signal, elapsed time, memory, and the `stdout` and `stderr` streams.

### Templates

Easily convert a folder of code templates (for algorithms and data structures) into vscode `snippets` using the `Load Templates` command.  Here are some basics on how they work:

Take a look at an example template file:

```cpp
#include <bits/stdc++.h>

using namespace std;

//begintemplate for
//description for loop template
for (int i = 0; i < n; i++) {
    cout << "test" << "\n";
}
//endtemplate for

// random comment

//begintemplate for2
for (int i = 2; i < 46; i -= 5) {
    cout << "bad" << "\n";
    cout.flush();
}
//endtemplate for2
```

This creates two templates named `for and `for2` (assuming that this file is directly inside the template directory).  Also note that only the template `for` has a description ("for loop template") and that template names cannot have spaces.

There is also an optional `config.json` file in your template directory which contains a few options:

* **Ignore Paths (ignorePaths):** A list of paths (relative to the template directory) that should be ignored.  This defaults to `['.git', '.vscode']`.
* **Replace Backslashes (replaceBackslashes):** Controls whether backslashes will be replaced with slashes in template names.  This defaults to `true`.

Here is what a `config.json` file using the default configuration options would look like:

```
{
    "ignorePaths": [".git", ".vscode"],
    "replaceBackslashes": true
}
```

#### Additional Notes

Here is the exact format of the directives included:

* `//begintemplate <name>`: Signifies the start of a template with the name `<name>`.  Note that `<name>` cannot have any spaces.  Adding multiple `//begintemplate` directives without ending previous ones causes errors.
* `//endtemplate <name>`: Ends a template with the name `<name>`.  Note that `<name>` must be the name of the last `//begintemplate` directive executed, otherwise it will throw an error.
* `//description <description...>`: Unlike the `<name>` parameter, the `<description...>` parameter can have spaces.  This simply specifies the description for the current template.  Furthermore, multiple `//description` directives cannot be in the same template, and a `//description` directive must be inside of a template.

Feel free to check the `src/test/templatesample` for some sample template usage (note that it also includes invalid directive usage for testing purposes).

### Supported Languages

* **C++:** Compiled using the `g++` command, exact specifications are shown below.  The `g++` command should be accessible from the command prompt.
* **Python:** Interpreted using the `py` command in the format `py <file name>`.  The `py` command should be accessible from the command prompt

## Commands

* **Build and Run (cp-tools.buildAndRun):** Compiles and runs the current open file on a set of predetermined test data.  See below in the configuration options for more information
* **Open Input File (cp-tools.openInputFile):** Opens the input file used to supply input for the `cp-tools.buildAndRun` command
* **Edit Option (cp-tools.editOption):** Edit a configuration option
* **Reset Category (cp-tools.resetCategory):** Reset a configuration category
* **Reset Options (cp-tools.resetOptions):** Resets all configuration options to their default values

* **WORK IN PROGRESS:**
    * **Cache Vue.js (cp-tools.cacheVue):** Caches Vue.js for offline use
    * **Load Templates (cp-tools.loadTemplates):** Load template folder to `snippets.json`
    * CANCELLED **Pack Templates (cp-tools.packTemplates):** Pack template folder into a single file
    * CANCELLED **Unpack Templates (cp-tools.unpackTemplates):** Unpack template file back into a folder

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

* Some cool code template stuff (not sure how useful this would be)
    * Command: Load Templates: Select a template folder and imports all of the templates found in that folder by overwriting the `snippets.json` file in the `.vscode` directory
        * Add description field
* Better UI
* Interactive stuff
* Performance
    * Cache the vue.js library to allow for offline use
    * Somehow make g++ somehow run in the background so that loading becomes like instant
* Add more languages
* Become less awkward
