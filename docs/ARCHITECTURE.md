# Architecture

CharmRun is a VS Code extension that manages Python run configurations via GUI and executes them through VS Code's debug API (`debugpy` launch configs).

## High-Level Components

- `src/extension.ts`
  - Activation entrypoint
  - Instantiates and wires store, tree provider, editor provider, status bar, and commands
- `src/types.ts`
  - Core type definitions (`RunConfiguration`, `ConfigFile`, enums)
  - Default config factory + ID generator
- `src/configStore.ts`
  - Reads/writes `.vscode/python-run-configs.json`
  - Tracks active configuration ID in workspace state
  - Emits change events and watches file updates
- `src/commands.ts`
  - Registers all extension commands and command handlers
- `src/runner.ts`
  - Validates configuration
  - Resolves interpreter and variables
  - Builds `vscode.DebugConfiguration` and launches with `startDebugging`
- `src/interpreterResolver.ts`
  - Resolves custom/selected interpreter with fallback chain
- `src/variableResolver.ts`
  - Expands supported `${...}` variables in strings/arrays/maps
- `src/treeView/*`
  - Provides sidebar tree items and item metadata
- `src/webview/*`
  - Hosts configuration editor UI and message-passing logic
- `src/statusBar.ts`
  - Manages active-config selector and run/debug buttons

## Runtime Flow

1. User triggers a run/debug command.
2. Command handler loads active or selected config from `ConfigStore`.
3. `Runner.execute` validates mandatory fields.
4. `InterpreterResolver` resolves executable path/command.
5. `VariableResolver` expands placeholders in config fields.
6. `Runner` builds debug config:
   - `type: debugpy`
   - `request: launch`
   - `program` (script mode) or `module` (module mode)
   - `python`, `args`, `cwd`, `env`, `console`
7. Extension calls `vscode.debug.startDebugging(..., { noDebug })`.

## Data Ownership

- Workspace-shared:
  - `.vscode/python-run-configs.json`
- User-local (not committed):
  - `workspaceState['charmrun.activeConfigId']`

This split allows teams to share configuration definitions while each developer keeps their own active selection.

## UI Surfaces

- Activity Bar view container: `charmrun-explorer`
- Tree view: `charmrun.configurationsView`
- Status bar:
  - selector (`$(gear)` or create prompt)
  - run (`$(play)`)
  - debug (`$(bug)`)
- Webview editor panel:
  - create/edit form for all config fields
  - browse actions for script/interpreter/cwd

## Extension Packaging

- TypeScript strict mode (`tsconfig.json`)
- Bundled by `esbuild` into `dist/extension.js`
- VS Code manifest in `package.json`
