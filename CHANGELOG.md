# Change Log

All notable changes to the "helmtk" extension will be documented in this file.

## [0.2.0] - 2024-12-04

### Added
- Test runner integration with command palette
- CodeLens support for running individual tests and test files
- "Helmtk Tests" output panel for test results
- Three new commands:
  - "Helmtk: Run All Tests" - Run all tests in chart
  - "Helmtk: Run Test File" - Run tests in current file
  - "Helmtk: Run Single Test" - Run a specific test
- Configuration option for custom helmtk binary path
- Real-time test output with color-coded pass/fail indicators
- Smart chart root detection from active editor file path

### Fixed
- Properly handle test names with spaces by removing shell option from spawn()
- Detect chart root from active test file path, supporting multi-chart workspaces
- Pass active document URI to test commands for accurate chart root detection
- Strip ANSI escape codes from test output for clean display in VSCode output panel

## [0.1.0] - 2024-01-18

### Added
- Initial release
- Syntax highlighting for `.helmtk` files
- Support for all language features:
  - Keywords: `if`, `else`, `end`, `for`, `in`, `do`, `break`, `continue`, `let`, `define`, `include`, `spread`
  - String literals (single-line and multiline)
  - String interpolation with `${...}`
  - Number literals (integers and floats)
  - Boolean literals: `true`, `false`
  - Null literal
  - All operators: arithmetic, comparison, logical, pipe
  - Function calls
  - Special identifiers: `Values`, `Release`, `Chart`, etc.
- Comment support with `#`
- Auto-closing pairs for brackets, quotes, and interpolation
- Code folding for control structures
