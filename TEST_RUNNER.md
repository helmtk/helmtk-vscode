# Test Runner Feature

This document describes the test runner integration added to the Helmtk VSCode extension.

## Overview

The extension now supports running Helmtk tests directly from VSCode with an integrated UI experience.

## Features

### 1. Command Palette Integration

Three new commands are available via the command palette (Cmd/Ctrl+Shift+P):

- **Helmtk: Run All Tests** - Runs all tests in the workspace
- **Helmtk: Run Test File** - Runs all tests in the current file
- **Helmtk: Run Single Test** - Runs a specific test (used by CodeLens)

### 2. CodeLens Integration

When viewing JavaScript test files in `helmtk/tests/*.js`, CodeLens annotations appear:

- At the **top of the file**: "▶ Run All Tests in File"
- Above each **test function**: "▶ Run Test" and "🐛 Debug Test"

Clicking these buttons runs the associated tests immediately.

### 3. Output Panel

Test results are displayed in a dedicated "Helmtk Tests" output panel with:

- Timestamp and command information
- Real-time streaming output from the helmtk test runner
- Color-coded pass/fail indicators (✓ and ✗)
- Detailed error messages for failing tests
- Summary statistics (passed/failed/total)

### 4. Configuration

Users can configure the helmtk binary path in VSCode settings:

```json
{
  "helmtk.binaryPath": "/custom/path/to/helmtk"
}
```

If not specified, the extension uses `helmtk` from the system PATH.

## Implementation Details

### File Structure

- `extension.js`: Main extension code with test runner logic
- `package.json`: Command definitions and configuration schema

### Key Components

1. **runTests()** function
   - Detects chart root from active editor (if in a helmtk/tests file) or workspace folder
   - Spawns the helmtk test command as a child process
   - Streams output to the VSCode output channel
   - Handles success/failure with appropriate user notifications

2. **TestCodeLensProvider** class
   - Parses test files to find test() function calls
   - Creates clickable CodeLens annotations
   - Supports filtering tests by name using regex patterns

3. **Command handlers**
   - `helmtk.runAllTests`: Runs all tests in workspace
   - `helmtk.runTestFile`: Runs tests in specific file
   - `helmtk.runSingleTest`: Runs test matching specific name

### Test Command Integration

The extension executes the helmtk CLI test command:

```bash
helmtk test <chart-path> --format=pretty [--match <pattern>]
```

- Uses `--format=pretty` for human-readable output
- Uses `--match <pattern>` flag to filter tests by name when running single tests
  - Spawns process without shell to properly handle test names with spaces
  - Arguments are passed as array to avoid shell quoting issues
- Captures stdout/stderr and displays in output panel

## User Experience

### Chart Root Detection

The extension automatically detects the chart root directory:
- If you're viewing/editing a file in `helmtk/tests/`, it uses the parent directory as the chart root
- Otherwise, it uses the workspace folder root

**Tip:** For best results, open a test file in `helmtk/tests/*.js` before running tests, so the extension can detect the correct chart directory.

### Running All Tests

1. Open command palette (Cmd/Ctrl+Shift+P)
2. Type "Helmtk: Run All Tests"
3. Press Enter
4. View results in "Helmtk Tests" output panel

### Running a Single Test

1. Open a test file (e.g., `helmtk/tests/basic.js`)
2. Find the test you want to run
3. Click "▶ Run Test" above the test function
4. View results in "Helmtk Tests" output panel

### Viewing Results

The output panel shows:
```
Running tests at 2:30:45 PM...
Command: helmtk test /path/to/chart --format=pretty
────────────────────────────────────────────────────────────────────────────────

basic.js
  ✓ configmap renders correctly
  ✓ rbac is enabled by default
  ✓ can access chart metadata

  3 passed, 0 failed, 3 total

────────────────────────────────────────────────────────────────────────────────
✓ All tests passed
```

## Future Enhancements

Potential improvements for future versions:

- **Test Explorer**: Integrate with VSCode's native Test Explorer UI
- **Debug Support**: Implement the "🐛 Debug Test" functionality
- **Watch Mode**: Auto-run tests on file changes
- **Coverage**: Display test coverage information
- **Test Discovery**: Show test status inline in the editor
- **Multi-root Support**: Better handling of multi-root workspaces
- **Test History**: Track test results over time
- **Filtering**: Advanced filtering options in the UI

## Version History

- **v0.2.0** (2024-12-04): Initial test runner implementation
