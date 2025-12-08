# Helmtk VS Code Extension

A VS Code extension providing comprehensive language support for [Helmtk](https://github.com/buchanae/helmtk), a template language for Helm charts.

## Features

### Syntax Highlighting
- Full syntax highlighting for `.helmtk` files
- Proper colorization of keywords, functions, strings, and comments

### Code Formatting
- Automatic formatting for Helmtk templates
- Intelligent indentation handling for blocks, braces, and control structures
- Format on save support (enabled by default)
- Format selection support

### Go to Definition
- Jump to template definitions: Ctrl/Cmd+Click on `include("template-name")` to navigate to the corresponding `define()` declaration
- Navigate to values definitions: Ctrl/Cmd+Click on `Values.foo.bar` to jump to the key in your `values.yaml` file
- Works across multiple files in your workspace

### Test Support
- Run all tests in your Helm chart
- Run tests from a specific test file
- Run individual tests by name
- CodeLens integration in test files for one-click test execution
- Test output displayed in dedicated output channel

## Commands

- `Helmtk: Run All Tests` - Run all tests in the current chart
- `Helmtk: Run Test File` - Run tests from the current file
- `Helmtk: Run Single Test` - Run a specific test by name

## Configuration

- `helmtk.binaryPath` - Path to the helmtk binary (defaults to `helmtk` in PATH)

## Requirements

The Helmtk CLI tool must be installed and available in your PATH, or configured via `helmtk.binaryPath`.
