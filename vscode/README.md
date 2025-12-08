# Helmtk for VSCode

Syntax highlighting for the Helmtk template language.

## Features

- **Syntax Highlighting** - Full syntax highlighting for `.helmtk` files
- **Auto-closing** - Auto-closing brackets, quotes, and interpolation markers
- **Comment toggling** - Use `Cmd+/` (Mac) or `Ctrl+/` (Windows/Linux) to toggle line comments
- **Code folding** - Fold `if/do/end`, `for/do/end`, and `define/do/end` blocks
- **Formatting** - Automatic code formatting with proper indentation
- **Go to Definition** - Navigate to template definitions and values.yaml fields
- **Test Runner** - Run Helmtk tests directly from VSCode with CodeLens integration

## Supported Syntax

### Keywords
- Control flow: `if`, `else`, `end`, `for`, `in`, `do`, `break`, `continue`
- Definitions: `let`, `define`, `include`, `spread`
- Constants: `true`, `false`, `null`

### Literals
- Strings: `"single line"` and `"""multiline"""`
- String interpolation: `"Hello ${name}"`
- Numbers: `42`, `3.14`
- Booleans: `true`, `false`
- Null: `null`

### Operators
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`
- Logical: `&&`, `||`, `!`
- Pipe: `|`

### Special Identifiers
Highlighted as constants: `Values`, `Release`, `Chart`, `Capabilities`, `Template`, `Files`

## Installation

### From Source

1. Copy this directory to your VSCode extensions folder:
   - **macOS/Linux**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`

2. Restart VSCode

3. Open any `.helmtk` file to see syntax highlighting

### Development

To work on this extension:

1. Open this directory in VSCode
2. Press `F5` to open a new VSCode window with the extension loaded
3. Create or open a `.helmtk` file to test highlighting
4. Make changes to `syntaxes/helmtk.tmLanguage.json`
5. Run "Developer: Reload Window" to see changes

## Test Runner

The extension provides integrated test running capabilities for Helmtk test suites.

### Running Tests

**Important:** For the extension to find your tests, make sure you have a test file open from your chart's `helmtk/tests/` directory. The extension will automatically detect the chart root from the file path.

There are multiple ways to run tests:

1. **Command Palette**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Helmtk: Run All Tests" to run all tests in the chart

2. **CodeLens** (appears in test files):
   - Click "▶ Run All Tests in File" at the top of any `.js` test file
   - Click "▶ Run Test" above individual test functions
   - Click "🐛 Debug Test" for debugging (placeholder for future feature)

3. **Output Panel**:
   - Test results appear in the "Helmtk Tests" output panel
   - Shows real-time test execution with pass/fail indicators
   - Displays detailed error messages for failing tests

### Test File Format

Tests are written in JavaScript and placed in `helmtk/tests/*.js`:

```javascript
test("my feature works", (t) => {
  // Set values
  t.Values.myFeature.enabled = true

  // Render templates
  let docs = t.render("deployment")

  // Make assertions
  t.assert(docs.length === 1, "expected 1 document")
  t.assert(docs[0].kind === "Deployment")
})
```

### Configuration

You can configure the path to the `helmtk` binary in VSCode settings:

```json
{
  "helmtk.binaryPath": "/path/to/helmtk"
}
```

Default is `helmtk` (uses PATH).

## Example

```helmtk
# Define a template
define("labels", app) {
  app: app
  version: "1.0"
}

# Main configuration
apiVersion: "apps/v1"
kind: "Deployment"

metadata: {
  name: Values.name
  labels: include("labels", Values.name)
}

spec: {
  replicas: Values.replicas || 1

  template: {
    spec: {
      containers: [
        {
          name: Values.name
          image: "${Values.image}:${Values.tag}"

          ports: [
            {name: "http", containerPort: 8080}

            if Values.debug do
              {name: "debug", containerPort: 5005}
            end
          ]

          env: for k, v in Values.env do
            {name: k, value: v}
          end
        }
      ]
    }
  }
}
```

## License

MIT

## Links

- [Helmtk Repository](https://github.com/buchanae/helmtk)
- [Language Reference](../../LANGUAGE.md)
