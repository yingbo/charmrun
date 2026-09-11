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

## Regenerating the README screenshot

`docs/images/config-editor.png` is generated, not captured by hand. The
configuration editor is plain HTML built by `src/webview/configEditorHtml.ts`,
so `scripts/screenshot.mjs` renders that markup in headless Chromium and frames
it with the configurations sidebar. Re-run it whenever the editor's fields or
buttons change, so the image cannot drift from the code:

```bash
npm i --no-save playwright-core
npx playwright install chromium
node scripts/screenshot.mjs
```

Set `CHROMIUM_PATH` to reuse an existing Chromium instead of downloading one.
The sample configuration shown in the image is defined at the top of the
script.

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
- Avoid creating git worktrees unless absolutely necessary
- The repository owner is the sole author. Commits, pull requests, comments and
  documentation carry no agent, AI or tooling attribution of any kind, and the
  commit author and committer are always the owner. See the Authorship section
  of `AGENTS.md`.
