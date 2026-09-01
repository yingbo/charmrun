# Publishing CharmRun

CharmRun targets two distribution channels:

| Channel | Used by | Required secret |
| --- | --- | --- |
| [VS Code Marketplace](https://marketplace.visualstudio.com) | VS Code, VS Code Insiders | `VSCE_PAT` |
| GitHub Releases (`.vsix`) | Manual install anywhere, including Cursor | none |

Microsoft's marketplace terms restrict it to Microsoft products, so Cursor,
Windsurf and VSCodium do not resolve extensions from it. Users on those editors
install the `.vsix` attached to each GitHub release.

## One-time setup

### VS Code Marketplace

1. Create an Azure DevOps organization and a personal access token scoped to
   **Marketplace → Manage** (all accessible organizations).
2. Create the `yingbo` publisher at
   <https://marketplace.visualstudio.com/manage>. It must match `publisher` in
   `package.json`.
3. Store the token as the repository secret `VSCE_PAT`:

   ```bash
   gh secret set VSCE_PAT -R yingbo/charmrun
   ```

Marketplace tokens expire (one year maximum). When a release fails to publish
with a 401, regenerate the token in Azure DevOps and re-run `gh secret set`.

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit, then tag and push:

   ```bash
   git tag -a v1.1.1 -m "CharmRun 1.1.1"
   git push origin v1.1.1
   ```

The `Release` workflow (`.github/workflows/release.yml`) then builds the VSIX,
attaches it to a GitHub release, and publishes to the Marketplace. It can also
be run manually from the Actions tab — leave the `publish` input unchecked to
build the VSIX without publishing.

The tag must match the `version` in `package.json`; nothing enforces this, and a
mismatch ships a VSIX whose version differs from the release name.

## Publishing by hand

```bash
npm ci
npm run vsix                 # -> charmrun.vsix
npx vsce publish --packagePath charmrun.vsix --pat <marketplace-token>
```

`npm run vsix` runs `check-types` and a production esbuild bundle through the
`vscode:prepublish` hook, so the packaged VSIX always matches the sources.

A given version can only be published once. If you publish by hand, the
tag-triggered run for the same version will fail with a conflict.

## Verifying the package

```bash
npm run vsix
npx vsce ls                  # files that will ship
code --install-extension charmrun.vsix
cursor --install-extension charmrun.vsix
```

Once published, the extension appears at
`https://marketplace.visualstudio.com/items?itemName=yingbo.charmrun` and is
searchable as "CharmRun" in the VS Code Extensions panel.
