# cp-tools (Competitive Programming Tools)

A set of tools to assist with Competitive Programming

## Features

Easy build and run

## Commands

* **Build and Run (cp-tools.buildAndRun):** Compiles and runs the current open file on a set of predetermined test data.  See below in the configuration options for more information
* **Open Input File (cp-tools.openInputFile):** Opens the input file used to supply input for the `cp-tools.buildAndRun` command
* **Reset Options (cp-tools.resetOptions):** Resets all configuration options to their default values

## Configuration Options

* **Build and Run (buildAndRun):** Configuration Options used by the `cp-tools.buildAndRun` command
    * **Input File (buildAndRun.inputFile):** Path to the input file used to supply input for the `cp-tools.buildAndRun` command
    * **Case Delimeter (buildAndRun.caseDelimeter):** In the input file, test cases are separated by a case delimiter, which is decided by this config option.  See below for an example
    * **Timeout (buildAndRun.timeout):** If a program executed by the `cp-tools.buildAndRun` command runs for too long, it will be killed.  The amount of time to wait before manually killing the program is determined by this configuration option.  The time is given in milliseconds.
    * **Sample Rate (buildAndRun.memSample):** Controls how quickly (time and) memory usage is sampled while the program is running.  The time is given in milliseconds.
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