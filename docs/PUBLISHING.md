# Publishing CharmRun

CharmRun targets three distribution channels:

| Channel | Used by | Required secret |
| --- | --- | --- |
| [Open VSX](https://open-vsx.org) | **Cursor**, Windsurf, VSCodium, Gitpod, Eclipse Theia | `OVSX_PAT` |
| [VS Code Marketplace](https://marketplace.visualstudio.com) | VS Code, VS Code Insiders | `VSCE_PAT` |
| GitHub Releases (`.vsix`) | Manual install anywhere | none |

**Cursor does not read the VS Code Marketplace.** Microsoft's marketplace terms
restrict it to Microsoft products, so Cursor resolves extensions from Open VSX.
Publishing to Open VSX is what makes CharmRun installable from Cursor's
Extensions panel.

## One-time setup

### Open VSX

1. Sign in at <https://open-vsx.org> with GitHub.
2. Accept the Eclipse Foundation Publisher Agreement
   (<https://open-vsx.org/user-settings/agreement>). Publishing fails until this
   is signed.
3. Create an access token under **Settings → Access Tokens**.
4. Claim the `yingbo` namespace, which must match `publisher` in `package.json`:

   ```bash
   npx ovsx create-namespace yingbo --pat <token>
   ```

5. Store the token as the repository secret `OVSX_PAT`
   (**Settings → Secrets and variables → Actions**).

### VS Code Marketplace (optional)

1. Create an Azure DevOps organization and a personal access token scoped to
   **Marketplace → Manage** (all accessible organizations).
2. Create the `yingbo` publisher at
   <https://marketplace.visualstudio.com/manage>.
3. Store the token as the repository secret `VSCE_PAT`.

The release workflow skips this step when `VSCE_PAT` is not set, so Open VSX
publishing works on its own.

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit, then tag and push:

   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

The `Release` workflow (`.github/workflows/release.yml`) then builds the VSIX,
attaches it to a GitHub release, and publishes to Open VSX (and to the
Marketplace when `VSCE_PAT` exists). It can also be run manually from the
Actions tab — leave the `publish` input unchecked to build the VSIX without
publishing.

## Publishing by hand

```bash
npm ci
npm run vsix                 # -> charmrun.vsix
npx ovsx publish charmrun.vsix --pat <open-vsx-token>
npx vsce publish --packagePath charmrun.vsix --pat <marketplace-token>
```

`npm run vsix` runs `check-types` and a production esbuild bundle through the
`vscode:prepublish` hook, so the packaged VSIX always matches the sources.

## Verifying the package

```bash
npm run vsix
npx vsce ls                  # files that will ship
code --install-extension charmrun.vsix
cursor --install-extension charmrun.vsix
```

Once published, the extension appears at
`https://open-vsx.org/extension/yingbo/charmrun` and is searchable as
"CharmRun" in Cursor's Extensions panel.
