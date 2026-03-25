# Contributing

## Development Setup

```bash
npm install
npm run compile
```

Run extension in development:

1. Open this repository in VS Code.
2. Press `F5` to launch Extension Development Host.

## Scripts

- `npm run compile`
  - Runs type-check (`tsc --noEmit`) and esbuild bundle
- `npm run watch`
  - Runs watch mode for type-check + bundling
- `npm run lint`
  - Runs ESLint on `src/**/*.ts`
- `npm run package`
  - Production bundle build

## Code Structure

- Entry: `src/extension.ts`
- Commands: `src/commands.ts`
- Storage: `src/configStore.ts`
- Execution: `src/runner.ts`
- UI:
  - Tree view: `src/treeView/`
  - Webview editor: `src/webview/`
  - Status bar: `src/statusBar.ts`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Project Conventions

- TypeScript strict mode is enabled
- Bundle output is `dist/extension.js` via esbuild
- Keep UI consistent with VS Code theme variables
- Store CharmRun-managed configs in `.vscode/launch.json`
- Keep active config selection in workspace state (user-local)

## Git Workflow

From repository rules (`AGENTS.md`):

- Use feature branches for issue-driven work
- Do not merge PRs as an agent
- Do not close issues as an agent
- Do not add `Co-Authored-By` lines in commit messages
- Avoid creating git worktrees unless absolutely necessary
