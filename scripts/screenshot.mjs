/**
 * Regenerates docs/images/config-editor.png, the README hero image.
 *
 * The configuration editor is plain HTML produced by
 * src/webview/configEditorHtml.ts, so the real editor markup can be rendered
 * in headless Chromium rather than captured by hand. That keeps the
 * screenshot honest: it always shows the fields and buttons the code
 * actually generates.
 *
 * Requires playwright-core and a Chromium build. Neither is a project
 * dependency, since only this script needs them:
 *
 *   npm i --no-save playwright-core
 *   npx playwright install chromium
 *   node scripts/screenshot.mjs
 *
 * Set CHROMIUM_PATH to use an existing Chromium instead of a downloaded one.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as esbuild from 'esbuild';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'images', 'config-editor.png');
const NONCE = 'charmrunscreenshot';

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error(
    'playwright-core is not installed.\n' +
      '  npm i --no-save playwright-core && npx playwright install chromium'
  );
  process.exit(1);
}

/** The configuration shown in the screenshot. Exercises every section. */
const CONFIG = {
  id: 'b6f0e0d2-1f4a-4f1e-9a3b-6d5c2f8e7a10',
  name: 'API Server',
  runType: 'script',
  script: 'src/api/main.py',
  module: '',
  interpreter: 'selected',
  args: ['--port', '8000', '--reload'],
  cwd: '${workspaceFolder}',
  env: { ENV: 'development', PORT: '8000' },
  envFile: '${workspaceFolder}/.env',
  terminal: 'integrated',
  runMode: 'run',
  preRun: [
    {
      id: 'step-1',
      type: 'externalTool',
      enabled: true,
      configId: '',
      command: 'alembic',
      args: ['upgrade', 'head'],
      cwd: '${workspaceFolder}',
      task: '',
    },
  ],
  extra: { justMyCode: true },
};

const EDITOR_CONTEXT = {
  availableConfigs: [
    { id: 'c2', name: 'Worker' },
    { id: 'c3', name: 'Pytest' },
  ],
  availableTasks: ['npm: build', 'pip: install -r requirements.txt'],
};

/** Sidebar rows, mirroring what ConfigTreeItem renders for these configs. */
const TREE_ITEMS = [
  { icon: 'play', name: 'API Server', description: 'src/api/main.py', active: true },
  { icon: 'file', name: 'Worker', description: 'src/worker/main.py', active: false },
  { icon: 'package', name: 'Pytest', description: '-m pytest', active: false },
];

/**
 * VS Code injects these at runtime. Values approximate the Dark Modern theme.
 */
const THEME = `
  --vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "DejaVu Sans", sans-serif;
  --vscode-font-size: 13px;
  --vscode-editor-font-family: "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace;
  --vscode-foreground: #cccccc;
  --vscode-descriptionForeground: #9d9d9d;
  --vscode-errorForeground: #f85149;
  --vscode-focusBorder: #0078d4;
  --vscode-panel-border: #3c3c3c;
  --vscode-input-background: #313131;
  --vscode-input-foreground: #cccccc;
  --vscode-inputValidation-errorBorder: #be1100;
  --vscode-button-background: #0078d4;
  --vscode-button-foreground: #ffffff;
  --vscode-button-hoverBackground: #026ec1;
  --vscode-button-secondaryBackground: #313131;
  --vscode-button-secondaryForeground: #cccccc;
  --vscode-button-secondaryHoverBackground: #3c3c3c;
  --vscode-editor-background: #1f1f1f;
  --vscode-editorWidget-background: #202020;
  --vscode-editorWidget-foreground: #cccccc;
  --vscode-editorWidget-border: #454545;
  --vscode-toolbar-hoverBackground: rgba(90, 93, 94, 0.31);
`;

const ICONS = {
  play: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#89d185" stroke-width="1.2"><circle cx="8" cy="8" r="6.2"/><path d="M6.6 5.4 11 8 6.6 10.6Z" fill="#89d185" stroke="none"/></svg>`,
  file: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#9d9d9d" stroke-width="1.2"><path d="M9.2 1.8H4.2v12.4h7.6V4.4z"/><path d="M9.2 1.8v2.6h2.6"/><path d="M6.6 8.4 5.4 9.6l1.2 1.2M9.4 8.4l1.2 1.2-1.2 1.2"/></svg>`,
  package: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#9d9d9d" stroke-width="1.2"><path d="M8 1.8 13.6 4.6v6.8L8 14.2 2.4 11.4V4.6z"/><path d="M2.4 4.6 8 7.4l5.6-2.8M8 7.4v6.8"/></svg>`,
  run: `<svg viewBox="0 0 16 16" width="13" height="13" fill="#8a8a8a"><path d="M4.5 3.2 12 8l-7.5 4.8z"/></svg>`,
  debug: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="#8a8a8a" stroke-width="1.2"><ellipse cx="8" cy="9" rx="3.4" ry="4"/><path d="M4.6 7.2 2.4 6M4.6 9.4H2.2M4.9 11.6 3 13.2M11.4 7.2 13.6 6M11.4 9.4h2.4M11.1 11.6 13 13.2M6.3 5.6a2 2 0 0 1 3.4 0"/></svg>`,
  charmrun: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  explorer: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#6e6e6e" stroke-width="1.7"><path d="M3 5h18M3 12h18M3 19h18"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#6e6e6e" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/></svg>`,
};

/** Builds the editor markup by calling the extension's own HTML generator. */
async function renderEditorHtml(tmp) {
  const stub = path.join(tmp, 'vscode-stub.js');
  const bundle = path.join(tmp, 'editor-html.cjs');
  fs.writeFileSync(stub, 'module.exports = {};');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src', 'webview', 'configEditorHtml.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: bundle,
    alias: { vscode: stub },
    logLevel: 'silent',
  });

  const { getEditorHtml } = require(bundle);
  const html = getEditorHtml({ cspSource: "'self'" }, CONFIG, NONCE, EDITOR_CONTEXT);

  // Supply what the VS Code webview host normally provides.
  const shim = `
<script nonce="${NONCE}">
  window.acquireVsCodeApi = () => ({ postMessage() {}, getState() {}, setState() {} });
</script>
<style nonce="${NONCE}">
  :root {${THEME}}
  html, body { background: var(--vscode-editor-background); }
</style>`;
  return html.replace('</head>', `${shim}\n</head>`);
}

/** Wraps the rendered editor in an editor-window frame with the sidebar. */
function composeHtml(editorPng) {
  const rows = TREE_ITEMS.map(
    (it) => `
      <div class="item${it.active ? ' active' : ''}">
        <span class="ic">${ICONS[it.icon]}</span>
        <span class="nm">${it.name}</span>
        <span class="ds">${it.description}</span>
        <span class="acts">${ICONS.run}${ICONS.debug}</span>
      </div>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 56px;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "DejaVu Sans", sans-serif;
         background: radial-gradient(1200px 700px at 12% 0%, #1b2436 0%, #12151a 45%, #0d0f12 100%); }
  .win { width: 1232px; margin: 0 auto; border-radius: 12px; overflow: hidden;
         border: 1px solid #333840;
         box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4); }
  .bar { height: 44px; background: #202020; border-bottom: 1px solid #2b2b2b;
         display: flex; align-items: center; padding: 0 14px; position: relative; }
  .dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
  .title { position: absolute; left: 0; right: 0; text-align: center;
           font-size: 13px; color: #9d9d9d; }
  .body { display: flex; background: #1f1f1f; }
  .act { width: 48px; background: #181818; border-right: 1px solid #2b2b2b;
         padding-top: 12px; display: flex; flex-direction: column;
         align-items: center; gap: 18px; }
  .act .sel { position: relative; }
  .act .sel::before { content: ''; position: absolute; left: -14px; top: -3px;
                      width: 2px; height: 26px; background: #0078d4; }
  .side { width: 284px; background: #181818; border-right: 1px solid #2b2b2b;
          padding-top: 10px; }
  .hd { font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
        color: #bbbbbb; padding: 0 16px 8px; font-weight: 700; }
  .item { display: flex; align-items: center; gap: 7px; height: 24px;
          padding: 0 10px 0 16px; font-size: 13px; color: #cccccc; }
  .item.active { background: #04395e; }
  .ic { display: flex; }
  .nm { white-space: nowrap; }
  .ds { color: #8a8a8a; font-size: 11px; white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; flex: 1; }
  .acts { display: flex; gap: 6px; align-items: center; }
  .pane { width: 900px; background: #1f1f1f; }
  .pane img { display: block; width: 900px; }
</style></head><body>
  <div class="win">
    <div class="bar">
      <span class="dot" style="background:#ff5f57"></span>
      <span class="dot" style="background:#febc2e"></span>
      <span class="dot" style="background:#28c840"></span>
      <span class="title">CharmRun &middot; ${CONFIG.name}</span>
    </div>
    <div class="body">
      <div class="act">
        <span class="sel">${ICONS.charmrun}</span>
        <span>${ICONS.explorer}</span>
        <span>${ICONS.search}</span>
      </div>
      <div class="side"><div class="hd">Run Configurations</div>${rows}</div>
      <div class="pane"><img src="data:image/png;base64,${editorPng}"></div>
    </div>
  </div>
</body></html>`;
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'charmrun-shot-'));
  const launch = { executablePath: process.env.CHROMIUM_PATH || undefined };

  const editorFile = path.join(tmp, 'editor.html');
  fs.writeFileSync(editorFile, await renderEditorHtml(tmp));

  const browser = await chromium.launch(launch);
  try {
    // Pass 1: the editor webview on its own, at the width VS Code gives it.
    const editorPage = await browser.newPage({
      viewport: { width: 900, height: 1000 },
      deviceScaleFactor: 2,
    });
    await editorPage.goto('file://' + editorFile);
    await editorPage.waitForTimeout(400);
    const height = await editorPage.evaluate(() => document.body.scrollHeight);
    await editorPage.setViewportSize({ width: 900, height: height + 32 });
    const editorPng = (await editorPage.screenshot()).toString('base64');
    await editorPage.close();

    // Pass 2: that render, framed in a window with the configurations sidebar.
    const composeFile = path.join(tmp, 'compose.html');
    fs.writeFileSync(composeFile, composeHtml(editorPng));
    const page = await browser.newPage({
      viewport: { width: 1350, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.goto('file://' + composeFile);
    await page.waitForTimeout(400);
    const box = await page.locator('body').boundingBox();
    await page.setViewportSize({ width: 1350, height: Math.ceil(box.height) });
    await page.waitForTimeout(200);
    await page.screenshot({ path: OUT });
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`wrote ${path.relative(ROOT, OUT)}`);
}

await main();
