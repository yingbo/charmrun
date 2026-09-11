# Agent Rules for CharmRun

## Git Workflow

### Branching
- Create feature branches for issue-driven work (example: `feature/issue-123-description`)
- Do not merge PRs yourself; the user will review and merge
- Do not close issues yourself; the user will close them

### Authorship

The repository owner is the sole author of this project. Nothing an agent
produces may carry agent, AI, or tooling attribution. This is not limited to
one trailer; it covers every artifact that leaves the working tree.

- NEVER add `Co-Authored-By` lines
- NEVER add `Claude-Session`, `Generated with`, or any other attribution
  trailer, footer, badge, or 🤖 marker
- Commit **author and committer** must both be the repository owner:
  `Yingbo Miao <yingbo@users.noreply.github.com>`. Check `git config user.name`
  and `user.email` before the first commit of a session and set them if the
  environment supplied anything else.
- The same applies to pull request titles and bodies, issue and review
  comments, tag messages, release notes, code comments, and documentation
- Do not credit the model, the assistant, or the session anywhere, or name
  them as a contributor. Referring to an agent instruction file by its
  filename (`AGENTS.md`, `CLAUDE.md`) is fine; that is repository
  configuration, not authorship.

Before pushing, verify:

```bash
git log origin/main..HEAD --format='%an <%ae> | %cn <%ce>' | sort -u
git log origin/main..HEAD --format='%B' | grep -i 'claude\|anthropic\|co-authored'
```

The first must list only the owner. The second must return nothing.

### Worktrees
- Do NOT create git worktrees unless absolutely necessary

## Project Overview

VS Code extension (CharmRun) providing PyCharm-style Python run configuration
management with a GUI editor. Built with TypeScript and esbuild.

## Development

- `npm run compile` to build
- `npm run lint` to run ESLint (flat config in `eslint.config.mjs`)
- `npm run watch` for development (auto-rebuild)
- F5 in VS Code launches Extension Development Host for testing
- TypeScript strict mode is enabled
- esbuild bundles to `dist/extension.js`
- Webview uses vanilla HTML + CSS variables for VS Code theme integration

## Architecture

- `src/extension.ts` - Entry point, wires components together
- `src/types.ts` - RunConfiguration interface and related types
- `src/configStore.ts` - CRUD for CharmRun-managed Python entries in .vscode/launch.json
- `src/runner.ts` - Build debug configs, launch via vscode.debug.startDebugging
- `src/preRunRunner.ts` - Execute before-launch steps (config/external tool/task)
- `src/variableResolver.ts` - ${workspaceFolder}, ${file}, ${env:VAR} expansion
- `src/interpreterResolver.ts` - Resolve Python interpreter path
- `src/treeView/` - Sidebar tree view for listing configurations
- `src/webview/` - Webview-based GUI form editor
- `src/statusBar.ts` - Status bar integration (selector, run, debug buttons)
- `src/commands.ts` - All command registrations and handlers

## Configuration Storage

Configs stored as CharmRun-managed entries in `.vscode/launch.json` per workspace folder.
Active config ID stored in VS Code's workspaceState (per-user, not committed).
