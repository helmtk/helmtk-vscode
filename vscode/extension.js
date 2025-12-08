const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

// Output channel for test results
let testOutputChannel;

function activate(context) {
  // Create output channel
  testOutputChannel = vscode.window.createOutputChannel('Helmtk Tests');

  const formatter = vscode.languages.registerDocumentFormattingEditProvider('helmtk', {
    provideDocumentFormattingEdits(document) {
      const edits = [];
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      const formatted = formatHelmtk(document.getText());
      edits.push(vscode.TextEdit.replace(fullRange, formatted));

      return edits;
    }
  });

  const rangeFormatter = vscode.languages.registerDocumentRangeFormattingEditProvider('helmtk', {
    provideDocumentRangeFormattingEdits(document, range) {
      const edits = [];
      const text = document.getText(range);
      const formatted = formatHelmtk(text);
      edits.push(vscode.TextEdit.replace(range, formatted));
      return edits;
    }
  });

  const definitionProvider = vscode.languages.registerDefinitionProvider('helmtk', {
    provideDefinition(document, position) {
      return provideDefinition(document, position);
    }
  });

  // Register test commands
  const runAllTestsCommand = vscode.commands.registerCommand('helmtk.runAllTests', () => {
    const activeEditor = vscode.window.activeTextEditor;
    runTests(activeEditor ? activeEditor.document.uri : null);
  });

  const runTestFileCommand = vscode.commands.registerCommand('helmtk.runTestFile', (uri) => {
    runTests(uri);
  });

  const runSingleTestCommand = vscode.commands.registerCommand('helmtk.runSingleTest', (testName) => {
    const activeEditor = vscode.window.activeTextEditor;
    runTests(activeEditor ? activeEditor.document.uri : null, testName);
  });

  // Register CodeLens provider
  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    { pattern: '**/helmtk/tests/*.js' },
    new TestCodeLensProvider()
  );

  context.subscriptions.push(formatter);
  context.subscriptions.push(rangeFormatter);
  context.subscriptions.push(definitionProvider);
  context.subscriptions.push(runAllTestsCommand);
  context.subscriptions.push(runTestFileCommand);
  context.subscriptions.push(runSingleTestCommand);
  context.subscriptions.push(codeLensProvider);
  context.subscriptions.push(testOutputChannel);
}

function formatHelmtk(text) {
  const lines = text.split('\n');
  const formatted = [];
  let indentLevel = 0;
  const indentSize = 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments (preserve them as-is)
    if (trimmed === '' || trimmed.startsWith('#')) {
      formatted.push(line);
      continue;
    }

    // Check for else keywords
    const startsWithElse = trimmed.startsWith('else');
    const isElseIf = trimmed.startsWith('else if');

    // Dedent before closing braces/brackets or 'end'
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed === 'end') {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Dedent before 'else' keywords (they should align with their 'if')
    if (startsWithElse) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Apply indentation
    const indent = ' '.repeat(indentLevel * indentSize);
    formatted.push(indent + trimmed);

    // Indent after opening braces/brackets or keywords
    const endsWithOpenBrace = trimmed.endsWith('{');
    const endsWithOpenBracket = trimmed.endsWith('[');
    const endsWithDo = trimmed.endsWith('do');
    const isDefine = trimmed.startsWith('define(');

    // Check if line both opens and closes on same line (e.g., {name: "foo"})
    const singleLineBrace = endsWithOpenBrace && trimmed.includes('}') &&
                           trimmed.lastIndexOf('}') > trimmed.indexOf('{');
    const singleLineBracket = endsWithOpenBracket && trimmed.includes(']') &&
                             trimmed.lastIndexOf(']') > trimmed.indexOf('[');

    if (!singleLineBrace && !singleLineBracket) {
      if (endsWithOpenBrace || endsWithOpenBracket || endsWithDo || isDefine) {
        indentLevel++;
      }
    }

    // For else/else if without 'do', we need to indent the next line
    // (this handles single-expression else branches)
    if (startsWithElse && !endsWithDo) {
      indentLevel++;
    }
  }

  return formatted.join('\n');
}

function provideDefinition(document, position) {
  const wordRange = document.getWordRangeAtPosition(position);
  if (!wordRange) {
    return null;
  }

  // Get the line to check if we're in an include() call or Values reference
  const line = document.lineAt(position.line).text;
  const word = document.getText(wordRange);

  // Check if we're in an include() call by looking for include("...")
  const includePattern = /include\s*\(\s*["']([^"']+)["']/g;
  let match;

  while ((match = includePattern.exec(line)) !== null) {
    const templateName = match[1];
    const matchStart = match.index + match[0].indexOf(templateName);
    const matchEnd = matchStart + templateName.length;
    const charPos = position.character;

    // Check if cursor is on the template name
    if (charPos >= matchStart && charPos <= matchEnd) {
      // Search for the define() declaration
      return findDefinition(document, templateName);
    }
  }

  // Check if we're on a Values reference (e.g., Values.foo.bar)
  const valuesPath = extractValuesPath(line, position.character);
  if (valuesPath) {
    return findValuesDefinition(document, valuesPath);
  }

  return null;
}

async function findDefinition(document, templateName) {
  // First, search in the current document
  const localResult = findDefinitionInDocument(document, templateName);
  if (localResult) {
    return localResult;
  }

  // If not found locally, search in workspace .helmtk files
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return null;
  }

  const files = await vscode.workspace.findFiles('**/*.helmtk', '**/node_modules/**', 100);

  for (const fileUri of files) {
    if (fileUri.toString() === document.uri.toString()) {
      continue; // Skip current document (already searched)
    }

    try {
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const result = findDefinitionInDocument(doc, templateName);
      if (result) {
        return result;
      }
    } catch (error) {
      // Skip files that can't be opened
      continue;
    }
  }

  return null;
}

function findDefinitionInDocument(document, templateName) {
  const text = document.getText();
  const lines = text.split('\n');

  // Pattern to match define("name", ...) or define('name', ...)
  const definePattern = new RegExp(
    `define\\s*\\(\\s*["']${escapeRegExp(templateName)}["']`,
    'g'
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = definePattern.exec(line);

    if (match) {
      const startPos = new vscode.Position(i, match.index);
      const endPos = new vscode.Position(i, match.index + match[0].length);
      return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
    }
  }

  return null;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractValuesPath(line, cursorPos) {
  // Match Values.foo.bar or Values.foo patterns
  // Look backwards and forwards from cursor to find the full path

  // Find all Values.* patterns in the line
  const valuesPattern = /Values(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;
  let match;

  while ((match = valuesPattern.exec(line)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Check if cursor is within this match
    if (cursorPos >= matchStart && cursorPos <= matchEnd) {
      // Extract the path after "Values."
      const fullPath = match[0];
      if (fullPath === 'Values') {
        return null; // Just "Values" with no property access
      }

      // Remove "Values." prefix and return the path
      const path = fullPath.substring(7); // Remove "Values."
      return path;
    }
  }

  return null;
}

async function findValuesDefinition(document, valuesPath) {
  // Find values.yaml or values.yml in the workspace
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return null;
  }

  // Look for values.yaml/values.yml files
  const yamlFiles = await vscode.workspace.findFiles(
    '{**/values.yaml,**/values.yml}',
    '**/node_modules/**',
    50
  );

  if (yamlFiles.length === 0) {
    return null;
  }

  // Try each values file until we find the path
  for (const fileUri of yamlFiles) {
    try {
      const doc = await vscode.workspace.openTextDocument(fileUri);
      const location = findYamlPath(doc, valuesPath);
      if (location) {
        return location;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

function findYamlPath(document, path) {
  const text = document.getText();
  const lines = text.split('\n');
  const pathParts = path.split('.');

  // First pass: try to find uncommented keys
  const result = findYamlPathInLines(lines, pathParts, false);
  if (result) {
    const startPos = new vscode.Position(result.line, result.column);
    const endPos = new vscode.Position(result.line, result.column + result.key.length);
    return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
  }

  // Second pass: if not found, try to find commented keys
  const commentedResult = findYamlPathInLines(lines, pathParts, true);
  if (commentedResult) {
    const startPos = new vscode.Position(commentedResult.line, commentedResult.column);
    const endPos = new vscode.Position(commentedResult.line, commentedResult.column + commentedResult.key.length);
    return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
  }

  return null;
}

function findYamlPathInLines(lines, pathParts, includeComments) {
  const indentStack = []; // Track indent levels for each path level

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    // Handle commented lines
    const isComment = line.trim().startsWith('#');

    let effectiveLine = line;
    let commentOffset = 0;
    let indent;

    if (isComment) {
      // For commented lines, get indent from the position before #
      const commentMatch = line.match(/^(\s*)#(.*)/);
      if (commentMatch) {
        const leadingSpaces = commentMatch[1];
        const commentContent = commentMatch[2];
        // Indent is the spaces before #, plus the spaces after # in the content
        indent = leadingSpaces.length + (commentContent.length - commentContent.trimStart().length);
        effectiveLine = leadingSpaces + commentContent.trimStart();
        // Calculate offset to the actual key in the original line
        commentOffset = line.indexOf(commentContent.trimStart()) - leadingSpaces.length;
      } else {
        continue;
      }
    } else {
      // Calculate indentation normally for uncommented lines
      indent = line.search(/\S/);
      if (indent === -1) {
        continue;
      }
    }

    // Extract key from YAML line (handle "key:" or "key: value")
    const keyMatch = effectiveLine.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (!keyMatch) {
      continue;
    }

    const key = keyMatch[1];
    const keyColumn = isComment ? indent + commentOffset : indent;

    // Pop from stack if we've dedented
    while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1].indent) {
      indentStack.pop();
    }

    // Current path depth
    const currentDepth = indentStack.length;

    // Check if this key matches what we're looking for at this depth
    if (currentDepth < pathParts.length && key === pathParts[currentDepth]) {
      if (currentDepth === pathParts.length - 1) {
        // Found the final key
        // In first pass (includeComments=false), only return uncommented
        // In second pass (includeComments=true), return any match
        if (!includeComments && isComment) {
          // Don't return commented keys in first pass, but do continue to next line
          // to allow finding uncommented version later
        } else {
          return { line: i, column: keyColumn, key: key };
        }
      } else {
        // Found an intermediate key, push to stack
        // Allow both commented and uncommented intermediate keys
        indentStack.push({ key: key, indent: indent });
      }
    }
  }

  return null;
}

async function runTests(testFileUri, testName) {
  // Find the chart root directory
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  // Try to find chart root from the provided URI or active editor
  let chartRoot = workspaceFolders[0].uri.fsPath;

  // Try to get the file path from URI parameter or active editor
  let currentFile = null;
  if (testFileUri) {
    currentFile = testFileUri.fsPath;
  } else {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      currentFile = activeEditor.document.uri.fsPath;
    }
  }

  // If we have a file path, try to extract chart root from helmtk/tests directory
  if (currentFile) {
    const helmtkTestsMatch = currentFile.match(/^(.*?)\/helmtk\/tests\//);
    if (helmtkTestsMatch) {
      chartRoot = helmtkTestsMatch[1];
    }
  }

  // Build command arguments
  const args = ['test', chartRoot, '--format=pretty'];

  if (testName) {
    // Use --match flag with properly quoted value to handle spaces
    args.push('--match', testName);
  }

  // Clear and show output channel
  testOutputChannel.clear();
  testOutputChannel.show(true);

  // Write header
  const timestamp = new Date().toLocaleTimeString();
  testOutputChannel.appendLine(`Running tests at ${timestamp}...`);
  if (testName) {
    testOutputChannel.appendLine(`Command: helmtk test ${chartRoot} --format=pretty --match "${testName}"`);
  } else {
    testOutputChannel.appendLine(`Command: helmtk test ${chartRoot} --format=pretty`);
  }
  testOutputChannel.appendLine('─'.repeat(80));
  testOutputChannel.appendLine('');

  return new Promise((resolve, reject) => {
    // Spawn helmtk test command without shell to avoid quote escaping issues
    const helmtkPath = vscode.workspace.getConfiguration('helmtk').get('binaryPath') || 'helmtk';
    const proc = spawn(helmtkPath, args, {
      cwd: chartRoot
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Strip ANSI escape codes for better display in VSCode output channel
      const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
      testOutputChannel.append(cleanText);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      // Strip ANSI escape codes for better display in VSCode output channel
      const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
      testOutputChannel.append(cleanText);
    });

    proc.on('close', (code) => {
      testOutputChannel.appendLine('');
      testOutputChannel.appendLine('─'.repeat(80));

      if (code === 0) {
        testOutputChannel.appendLine('✓ All tests passed');
        vscode.window.showInformationMessage('All Helmtk tests passed');
        resolve();
      } else {
        testOutputChannel.appendLine(`✗ Tests failed with exit code ${code}`);
        vscode.window.showErrorMessage('Some Helmtk tests failed');
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      testOutputChannel.appendLine('');
      testOutputChannel.appendLine('─'.repeat(80));
      testOutputChannel.appendLine(`Error running tests: ${err.message}`);
      vscode.window.showErrorMessage(`Failed to run tests: ${err.message}`);
      reject(err);
    });
  });
}

// CodeLens provider for test files
class TestCodeLensProvider {
  provideCodeLenses(document) {
    const codeLenses = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Find test() function calls
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const testMatch = line.match(/test\s*\(\s*["']([^"']+)["']/);

      if (testMatch) {
        const testName = testMatch[1];
        const position = new vscode.Position(i, 0);
        const range = new vscode.Range(position, position);

        // Add "Run Test" lens
        const runCommand = {
          title: '▶ Run Test',
          command: 'helmtk.runSingleTest',
          arguments: [testName]
        };
        codeLenses.push(new vscode.CodeLens(range, runCommand));

        // Add "Debug Test" lens (placeholder for future implementation)
        const debugCommand = {
          title: '🐛 Debug Test',
          command: 'helmtk.debugTest',
          arguments: [testName]
        };
        codeLenses.push(new vscode.CodeLens(range, debugCommand));
      }
    }

    // Add "Run All Tests" at the top of the file
    if (codeLenses.length > 0) {
      const topPosition = new vscode.Position(0, 0);
      const topRange = new vscode.Range(topPosition, topPosition);

      const runAllCommand = {
        title: '▶ Run All Tests in File',
        command: 'helmtk.runAllTests'
      };
      codeLenses.unshift(new vscode.CodeLens(topRange, runAllCommand));
    }

    return codeLenses;
  }
}

function deactivate() {
  if (testOutputChannel) {
    testOutputChannel.dispose();
  }
}

module.exports = {
  activate,
  deactivate
};
