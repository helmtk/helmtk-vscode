# Installing the Helmtk VSCode Extension

## Quick Install (Recommended)

1. **Copy to extensions folder:**

   ```bash
   # On macOS/Linux
   cp -r /path/to/helmtk/ext/vscode ~/.vscode/extensions/helmtk-0.1.0

   # On Windows (PowerShell)
   Copy-Item -Recurse "C:\path\to\helmtk\ext\vscode" "$env:USERPROFILE\.vscode\extensions\helmtk-0.1.0"
   ```

2. **Restart VSCode**

3. **Verify installation:**
   - Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
   - Type "Extensions: Show Installed Extensions"
   - Look for "Helmtk" in the list

4. **Test it:**
   - Create a new file with `.helmtk` extension
   - Start typing - you should see syntax highlighting!

## Development Install

If you want to modify or develop the extension:

1. **Open the extension folder in VSCode:**
   ```bash
   code /path/to/helmtk/ext/vscode
   ```

2. **Press F5** to launch Extension Development Host
   - This opens a new VSCode window with the extension loaded

3. **Test changes:**
   - Open a `.helmtk` file in the new window
   - Make changes to `syntaxes/helmtk.tmLanguage.json`
   - Run "Developer: Reload Window" (`Cmd+R` or `Ctrl+R`) to see changes

## Package for Distribution

To create a `.vsix` package for sharing:

1. **Install vsce (VSCode Extension Manager):**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Package the extension:**
   ```bash
   cd /path/to/helmtk/ext/vscode
   vsce package
   ```

3. **Install the .vsix file:**
   - In VSCode: Extensions view → `...` menu → Install from VSIX
   - Or use command line:
     ```bash
     code --install-extension helmtk-0.1.0.vsix
     ```

## Troubleshooting

### Extension not loading
- Check that the folder is in `~/.vscode/extensions/`
- Verify the folder name is `helmtk-0.1.0` (or any valid name)
- Restart VSCode completely

### No syntax highlighting
- Check the file extension is `.helmtk`
- Open Command Palette → "Change Language Mode" → Select "Helmtk"
- Check the bottom right corner shows "Helmtk" as the language

### Changes not appearing
- After modifying grammar files, fully reload VSCode
- In Extension Development Host, use "Developer: Reload Window"

## Uninstall

```bash
# On macOS/Linux
rm -rf ~/.vscode/extensions/helmtk-*

# On Windows (PowerShell)
Remove-Item -Recurse "$env:USERPROFILE\.vscode\extensions\helmtk-*"
```

Then restart VSCode.

## Features to Test

After installation, open `test/example.helmtk` to verify these features work:

- [x] Keywords highlighted (if, for, let, define, etc.)
- [x] Strings highlighted (both single-line and multiline)
- [x] String interpolation `${...}` highlighted
- [x] Numbers highlighted
- [x] Comments highlighted
- [x] Operators highlighted
- [x] Function calls highlighted
- [x] Special identifiers (Values, Release, etc.) highlighted
- [x] Auto-closing brackets and quotes
- [x] Comment toggling with `Cmd+/` or `Ctrl+/`
- [x] Code folding on if/for/define blocks
