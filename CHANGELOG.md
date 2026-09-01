# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Distribution setup so CharmRun can be installed from Cursor: `npm run vsix`
  builds a VSIX, and `npm run publish:openvsx` / `npm run publish:marketplace`
  publish it to Open VSX and the VS Code Marketplace.
- `Release` GitHub Actions workflow that builds the VSIX on a `v*` tag, attaches
  it to the GitHub release, and publishes to Open VSX (and the Marketplace when
  `VSCE_PAT` is configured).
- `docs/PUBLISHING.md` with registry setup and release steps.

## [1.1.0] - 2026-08-30

### Added

- Before-launch (pre-run) steps on every run configuration, PyCharm-style.
- Step types: run another CharmRun configuration (picked from a dropdown of
  configurations in the same workspace folder), run an external tool
  (command + arguments + working directory), or run a VS Code task.
- Before Launch section in the configuration editor: add, reorder, enable or
  disable, and remove steps.
- Steps run in order before the main launch; a failing, cancelled, or
  non-zero-exit step aborts the launch.
- Circular before-launch references are detected and reported instead of
  recursing.
- Step output and failures are logged to the `CharmRun Before Launch` output
  channel; progress is shown in a cancellable notification.
- Steps are persisted in `launch.json` under `charmrunPreRun`.

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
