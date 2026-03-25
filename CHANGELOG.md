# Changelog

All notable changes to this project are documented in this file.

## [0.1.0] - 2026-03-11

### Added

- Initial CharmRun implementation.
- Activity Bar container and run-configuration tree view.
- Webview-based run configuration editor (create/edit).
- Workspace config storage in CharmRun-managed entries inside `.vscode/launch.json`.
- Run/debug execution using VS Code debug API with `debugpy` launch configs.
- Status bar integration for active config selection and run/debug actions.
- Command set for create/edit/delete/duplicate/select/run/debug/refresh.
- Variable resolver for common VS Code placeholders and `${env:*}`.
- Interpreter resolution strategy with Python extension and PATH fallbacks.
- Support for multi-root workspaces.
