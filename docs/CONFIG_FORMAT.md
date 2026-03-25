# Configuration Format

CharmRun stores managed run configurations in:

`<workspace>/.vscode/launch.json`

CharmRun only manages Python `debugpy` launch entries that it created itself or that the user explicitly adopted.

## Managed Entry Shape

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run API Server",
      "type": "debugpy",
      "request": "launch",
      "program": "src/api/main.py",
      "args": ["--port", "8000"],
      "cwd": "${workspaceFolder}",
      "env": {
        "ENV": "dev"
      },
      "console": "integratedTerminal",
      "justMyCode": true,
      "charmrunManaged": true,
      "charmrunId": "uuid-v4-like-string",
      "charmrunRunMode": "run"
    }
  ]
}
```

## Mapping

- `name` -> `name`
- `runType = "script"` -> `program`
- `runType = "module"` -> `module`
- `interpreter` -> `python` when a custom interpreter is set
- `interpreter = "selected"` -> omit `python` so VS Code/Python uses the selected interpreter
- `args` -> `args`
- `cwd` -> `cwd`
- `env` -> `env`
- `terminal` -> `console`
- `runMode` -> `charmrunRunMode`

CharmRun metadata:

- `charmrunManaged: true`
- `charmrunId: string`
- `charmrunRunMode: "run" | "debug"`

## Adoption

Use `CharmRun: Adopt launch.json Configuration` to take over an existing Python `debugpy` launch config in place. CharmRun adds its metadata to that same `launch.json` entry and then edits it through the GUI.

## Preserved Fields

CharmRun preserves unknown fields on managed Python launch entries. Existing fields such as `justMyCode`, `subProcess`, or `envFile` remain in `launch.json` when you edit the config in the GUI.

## Validation Rules

- `name` is required
- `program` is required for script configs
- `module` is required for module configs

## Variable Placeholders

CharmRun resolves:

- `${workspaceFolder}`
- `${workspaceFolderBasename}`
- `${file}`
- `${fileBasename}`
- `${fileBasenameNoExtension}`
- `${fileDirname}`
- `${fileExtname}`
- `${relativeFile}`
- `${env:VARNAME}`

## Multi-Root Behavior

Each workspace folder can have its own `.vscode/launch.json`.  
CharmRun shows all CharmRun-managed configurations across workspace folders in one tree.
