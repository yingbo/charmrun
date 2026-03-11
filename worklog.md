# CharmRun Implementation Worklog

## Overview

VS Code extension providing PyCharm-style Python run configuration management with a GUI editor. Built with TypeScript, bundled with esbuild.

## Architecture

```
src/
├── extension.ts              # Entry point - activate/deactivate
├── types.ts                  # RunConfiguration interface, enums, helpers
├── configStore.ts            # CRUD for .vscode/python-run-configs.json
├── variableResolver.ts       # ${workspaceFolder}, ${file}, ${env:VAR} expansion
├── interpreterResolver.ts    # Python interpreter resolution
├── runner.ts                 # Build DebugConfiguration, launch via debugpy
├── commands.ts               # All 12 command registrations
├── statusBar.ts              # Status bar: config selector + run/debug buttons
├── treeView/
│   ├── configTreeProvider.ts # TreeDataProvider for sidebar panel
│   └── configTreeItem.ts    # TreeItem with contextValue for menus
└── webview/
    ├── configEditorProvider.ts # WebviewPanel management + message passing
    └── configEditorHtml.ts   # Full HTML generation with inline CSS/JS
```

## Data Model

`RunConfiguration` stored in `.vscode/python-run-configs.json`:
- `id` (UUID) - stable reference surviving renames
- `name` - user-friendly label
- `runType` - "script" | "module"
- `script` / `module` - execution target
- `interpreter` - "selected" (Python ext) or custom path
- `args` - string array
- `cwd` - working directory with variable support
- `env` - key-value environment variables
- `terminal` - "integrated" | "external" | "internalConsole"
- `runMode` - "run" | "debug"

Active config ID stored in `workspaceState` (per-user, not committed to VCS).

## Key Design Decisions

1. **debugpy** type (not deprecated `python`) for debug configurations
2. **UUID id** on configs for stable references
3. **esbuild** bundler per VS Code docs recommendation
4. **Vanilla HTML + CSS variables** in webview (no framework dependency)
5. **FileSystemWatcher** on config file for external change detection
6. **Inline webview script** with CSP nonce for security
7. **@vscode-elements** not used in final implementation - vanilla HTML form elements with VS Code CSS variables provide sufficient native look

## Commands Registered (12 total)

| Command | Description | Source |
|---------|-------------|--------|
| `charmrun.runConfiguration` | Run active config | Status bar / palette |
| `charmrun.debugConfiguration` | Debug active config | Status bar / palette |
| `charmrun.runCurrentFile` | Run open .py file | Palette |
| `charmrun.debugCurrentFile` | Debug open .py file | Palette |
| `charmrun.createConfiguration` | Open editor for new config | Tree title / palette |
| `charmrun.editConfiguration` | Edit existing config | Tree context / palette |
| `charmrun.deleteConfiguration` | Delete with confirmation | Tree context / palette |
| `charmrun.duplicateConfiguration` | Copy config | Tree context |
| `charmrun.selectActiveConfig` | QuickPick selector | Status bar / palette |
| `charmrun.refreshConfigurations` | Refresh tree view | Tree title |
| `charmrun.runConfigFromTree` | Run specific config | Tree inline button |
| `charmrun.debugConfigFromTree` | Debug specific config | Tree inline button |

## UI Components

### Tree View (Activity Bar)
- Custom view container "charmrun-explorer" with play icon
- Flat list of configs across workspace folders
- Inline run/debug buttons per item
- Context menu: Edit, Duplicate, Delete
- Welcome view when no configs exist

### Webview Editor
- Full HTML form with VS Code theme CSS variables
- Fields: Name, Run Type, Script/Module, Interpreter, Args, CWD, Env Vars, Terminal, Run Mode
- Browse buttons for file/folder pickers via `showOpenDialog`
- Dynamic env variable rows (add/remove)
- Args parsed with quote-aware splitting
- Message passing protocol: save/cancel/browse* (webview→ext), setFilePath (ext→webview)

### Status Bar (Left-aligned)
- Config selector: `$(gear) ConfigName` or `$(add) Create Run Config`
- Run button: `$(play)` (hidden when no active config)
- Debug button: `$(bug)` (hidden when no active config)

## Execution Flow

1. User triggers Run/Debug
2. `Runner.execute()` validates config (name, script/module present)
3. `InterpreterResolver.resolve()` finds Python interpreter:
   - Custom path → validate exists
   - "selected" → `python.interpreterPath` command → config fallback → PATH fallback
4. `VariableResolver.resolve()` expands `${workspaceFolder}`, `${file}`, `${env:*}` etc.
5. Build `vscode.DebugConfiguration` with type `debugpy`, request `launch`
6. Call `vscode.debug.startDebugging(folder, config, { noDebug: mode === 'run' })`

## Variable Expansion

Supported: `${workspaceFolder}`, `${workspaceFolderBasename}`, `${file}`, `${fileBasename}`, `${fileBasenameNoExtension}`, `${fileDirname}`, `${fileExtname}`, `${relativeFile}`, `${env:VARNAME}`

## Build

- `npm run compile` - Type-check + esbuild bundle
- `npm run watch` - Development watch mode
- Output: `dist/extension.js` (42KB bundled)
- F5 launches Extension Development Host

## Files Created

- `package.json` - Extension manifest with full contributes section
- `tsconfig.json` - TypeScript strict mode, ES2021 target
- `esbuild.js` - Standard VS Code esbuild pattern
- `.vscode/launch.json` - Extension host debug config
- `.vscode/tasks.json` - Build tasks
- `.vscodeignore` - VSIX packaging exclusions
- `AGENTS.md` - Agent rules for AI assistance
- `media/icon.svg` - Activity bar icon (play triangle)
- All `src/` files listed in architecture above
