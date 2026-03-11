# Agent Rules for CharmRun

## Git Workflow

### Branching
- Create feature branches for issue-driven work (example: `feature/issue-123-description`)
- Do not merge PRs yourself; the user will review and merge
- Do not close issues yourself; the user will close them

### Commits
- NEVER add `Co-Authored-By` lines in commit messages
- The repository owner must be the sole contributor

### Worktrees
- Do NOT create git worktrees unless absolutely necessary

## Project Overview

VS Code extension (CharmRun) providing PyCharm-style Python run configuration
management with a GUI editor. Built with TypeScript and esbuild.

## Development

- `npm run compile` to build
- `npm run watch` for development (auto-rebuild)
- F5 in VS Code launches Extension Development Host for testing
- TypeScript strict mode is enabled
- esbuild bundles to `dist/extension.js`
- Webview uses vanilla HTML + CSS variables for VS Code theme integration

## Architecture

- `src/extension.ts` - Entry point, wires components together
- `src/types.ts` - RunConfiguration interface and related types
- `src/configStore.ts` - CRUD for .vscode/python-run-configs.json
- `src/runner.ts` - Build debug configs, launch via vscode.debug.startDebugging
- `src/variableResolver.ts` - ${workspaceFolder}, ${file}, ${env:VAR} expansion
- `src/interpreterResolver.ts` - Resolve Python interpreter path
- `src/treeView/` - Sidebar tree view for listing configurations
- `src/webview/` - Webview-based GUI form editor
- `src/statusBar.ts` - Status bar integration (selector, run, debug buttons)
- `src/commands.ts` - All command registrations and handlers

## Configuration Storage

Configs stored in `.vscode/python-run-configs.json` per workspace folder.
Active config ID stored in VS Code's workspaceState (per-user, not committed).
