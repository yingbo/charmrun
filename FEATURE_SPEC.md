# FEATURE_SPEC.md

# VS Code Extension Feature Specification
## Python Run Configuration Manager

---

# 1. Objective

Create a Visual Studio Code extension that provides a **PyCharm-style run configuration system for Python** using a **graphical interface instead of JSON configuration files**.

The extension allows users to create and manage **named Python run configurations**, and execute them quickly through GUI elements.

The system must integrate with VS Code's debugging system but **hide JSON configuration complexity** from the user.

The extension is designed specifically for **Python development workflows**.

---

# 2. Problem Being Solved

In VS Code, Python execution is normally configured through:

launch.json

Problems:

- Editing JSON is inconvenient
- Users must know configuration syntax
- Managing multiple configurations is cumbersome
- The workflow is less intuitive than IDEs like PyCharm

This extension introduces a **GUI-driven run configuration manager**.

---

# 3. Core Concepts

A **Run Configuration** represents a reusable execution setup for running Python code.

Examples:

Run API Server
Run Worker
Run Database Migration
Run Debug Script

Each configuration contains:

- execution target
- interpreter
- arguments
- environment variables
- working directory
- run/debug mode

---

# 4. Run Configuration Data Model

Each run configuration contains the following fields.

---

## 4.1 Name

User-friendly configuration name.

Example:

Run API Server

Required.

---

## 4.2 Run Type

Defines how Python executes the target.

Supported values:

### Script

Run a Python script.

Equivalent command:

python script.py

### Module

Run Python module.

Equivalent command:

python -m module_name

---

## 4.3 Script Path

Used when run type is **script**.

Example:

src/server/main.py

Relative to workspace root.

---

## 4.4 Module Name

Used when run type is **module**.

Example:

uvicorn
pytest
myproject.worker

---

## 4.5 Python Interpreter

Specifies interpreter.

Supported options:

### Use Selected Interpreter

Use interpreter currently selected by the Python extension.

### Custom Interpreter

User provides path.

Example:

/usr/bin/python3

or

/Users/user/project/.venv/bin/python

---

## 4.6 Arguments

Command-line arguments.

Example:

–port 8000 –reload

Internally stored as argument list.

---

## 4.7 Working Directory

Default:

${workspaceFolder}

Example override:

${workspaceFolder}/src

---

## 4.8 Environment Variables

Key-value pairs.

Example:

ENV=dev
DEBUG=true

Multiple variables supported.

---

## 4.9 Terminal Type

Defines execution terminal.

Options:

Integrated Terminal
External Terminal
Internal Debug Console

---

## 4.10 Run Mode

Execution type.

Run
Debug

Debug mode enables debugger.

---

# 5. Configuration Storage

Configurations must be stored in workspace.

File:

.vscode/python-run-configs.json

Example:

{
“configurations”: [
{
“name”: “Run API”,
“runType”: “script”,
“script”: “src/api/main.py”,
“module”: “”,
“interpreter”: “selected”,
“args”: [”–port”, “8080”],
“cwd”: “${workspaceFolder}”,
“env”: {
“ENV”: “dev”
},
“terminal”: “integrated”,
“runMode”: “run”
}
]
}

---

# 6. Run Configurations Panel

The extension must provide a panel listing configurations.

Example:

Run Configurations

▶ Run API
▶ Run Worker
▶ Debug Migration
	•	Add Configuration

Each configuration must support actions:

Run
Debug
Edit
Delete
Duplicate

---

# 7. Configuration Editor

Editing a configuration must open a **GUI form editor**.

Fields shown:

Name
Run Type
Script path
Module name
Interpreter
Arguments
Working directory
Environment variables
Terminal
Run mode

Users must be able to:

Save
Cancel

---

# 8. Running a Configuration

Execution steps:

1. Load configuration
2. Resolve interpreter
3. Expand variables
4. Build VS Code debug configuration
5. Launch execution

---

# 9. Debug Execution

Debug execution behaves the same as run but enables debugger.

Breakpoints must work normally.

---

# 10. Run Current File Feature

The extension must provide a **Run Current File command**.

Purpose:

Allow quick execution of the Python file currently open in the editor without creating a configuration.

Example scenario:

User is editing:

scripts/import_data.py

Running command executes:

python scripts/import_data.py

The command must:

- detect active Python file
- use selected interpreter
- use workspace folder as working directory
- run without debugger by default

Optional parameters may include:

arguments
environment variables
working directory override

A corresponding command must exist:

Run Current Python File

There should also be:

Debug Current Python File

---

# 11. Quick Run Configuration Dropdown

The extension must provide a **quick run selector similar to PyCharm**.

This must appear in the **VS Code status bar**.

Example display:

Run Config: Run API ▼

Clicking it opens configuration selector.

Example list:

Run API
Run Worker
Run Migration
Run Current File

Selecting an item sets it as the **active configuration**.

---

# 12. Run / Debug Buttons

After selecting configuration, user can execute quickly.

Example UI concept:

Run Config: Run API ▼   ▶ Run   🐞 Debug

Run button:

Execute without debugger.

Debug button:

Launch debugger.

---

# 13. Command Palette Integration

Commands must exist for:

Run Configuration
Debug Configuration
Run Current Python File
Debug Current Python File
Create Configuration
Edit Configuration
Delete Configuration
Select Active Configuration

---

# 14. Status Bar Integration

Status bar must show active configuration.

Example:

Run Config: Run API

Clicking opens configuration selector.

---

# 15. Variable Expansion

Support standard variables.

Examples:

${workspaceFolder}
${file}
${fileDirname}
${env:VAR}

Variables must resolve before execution.

---

# 16. Error Handling

Extension must detect common errors:

Interpreter not found
Script path invalid
Module invalid
Working directory missing

Errors must show clear messages.

---

# 17. Multi-root Workspace Support

Each workspace folder may have its own configuration file.

Example:

projectA/.vscode/python-run-configs.json
projectB/.vscode/python-run-configs.json

---

# 18. Default Behavior

If no configuration exists:

Extension prompts user to create configuration.

Wizard should ask for:

script or module
interpreter
arguments

---

# 19. Non-Goals

The extension must NOT implement:

Docker execution
Remote interpreters
SSH debugging
Test framework integration
Framework-specific launchers

---

# 20. Minimum Viable Product

The extension is complete when users can:

Create run configurations
Edit configurations through GUI
Run configurations
Debug configurations
Run current Python file
Quickly switch configurations
Execute configurations from dropdown

No manual JSON editing required.

---

# End of Feature Specification