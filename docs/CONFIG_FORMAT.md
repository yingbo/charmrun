# Configuration Format

CharmRun stores run configurations in:

`<workspace>/.vscode/python-run-configs.json`

## Schema

```json
{
  "version": 1,
  "configurations": [
    {
      "id": "uuid-v4-like-string",
      "name": "Run API Server",
      "runType": "script",
      "script": "src/api/main.py",
      "module": "",
      "interpreter": "selected",
      "args": ["--port", "8000"],
      "cwd": "${workspaceFolder}",
      "env": {
        "ENV": "dev"
      },
      "terminal": "integrated",
      "runMode": "run"
    }
  ]
}
```

## Field Reference

- `version`: number
  - Current value: `1`
- `configurations`: array of run configurations

Run configuration fields:

- `id`: string
  - Stable unique identifier used internally (active config, updates)
- `name`: string
  - Display name in tree/status bar
- `runType`: `"script"` | `"module"`
- `script`: string
  - Used when `runType = "script"`
- `module`: string
  - Used when `runType = "module"`
- `interpreter`: string
  - `"selected"` to use resolved interpreter
  - Or custom path/command (for example `/usr/bin/python3` or `python3`)
- `args`: string[]
  - Arguments passed to program/module
- `cwd`: string
  - Working directory, supports variable placeholders
- `env`: `{ [key: string]: string }`
  - Environment variables
- `terminal`: `"integrated"` | `"external"` | `"internalConsole"`
- `runMode`: `"run"` | `"debug"`
  - Default mode when running this configuration (can be overridden by command)

## Validation Rules

- `name` is required
- `script` is required for `runType = "script"`
- `module` is required for `runType = "module"`

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

Each workspace folder can have its own `.vscode/python-run-configs.json`.  
CharmRun shows all configurations across workspace folders in one tree.
