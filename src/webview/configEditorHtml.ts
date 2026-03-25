import * as vscode from 'vscode';
import { RunConfiguration } from '../types';

export function getEditorHtml(
  webview: vscode.Webview,
  config: RunConfiguration,
  nonce: string
): string {
  const configJson = JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>Edit Run Configuration</title>
  <style nonce="${nonce}">
    :root {
      --spacing: 8px;
    }
    body {
      padding: 16px 24px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      max-width: 700px;
      margin: 0 auto;
    }
    h2 {
      margin: 0 0 16px 0;
      font-weight: 600;
      font-size: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }
    input, select, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border, rgba(128,128,128,0.35)));
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      outline: none;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--vscode-focusBorder);
    }
    select {
      appearance: auto;
    }
    .form-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .form-row .field {
      flex: 1;
    }
    .browse-btn, .add-btn, .remove-btn {
      padding: 6px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
      white-space: nowrap;
    }
    .browse-btn:hover, .add-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .remove-btn {
      padding: 6px 8px;
      color: var(--vscode-errorForeground);
    }
    .env-section {
      margin-top: 4px;
    }
    .env-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
      align-items: center;
    }
    .env-row input {
      flex: 1;
    }
    .env-row .env-key {
      flex: 0 0 35%;
    }
    .button-bar {
      margin-top: 20px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      border-top: 1px solid var(--vscode-panel-border);
      padding-top: 16px;
    }
    .primary-btn {
      padding: 6px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
    }
    .primary-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .secondary-btn {
      padding: 6px 16px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
    }
    .secondary-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .hidden {
      display: none;
    }
    .section-label {
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
  </style>
</head>
<body>
  <h2>Run Configuration</h2>

  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" placeholder="e.g. Run API Server" />
  </div>

  <div class="form-group">
    <label for="runType">Run Type</label>
    <select id="runType">
      <option value="script">Script</option>
      <option value="module">Module</option>
    </select>
  </div>

  <div class="form-group" id="script-group">
    <label for="script">Script Path</label>
    <div class="form-row">
      <div class="field">
        <input type="text" id="script" placeholder="e.g. src/main.py" />
      </div>
      <button class="browse-btn" id="browse-script">Browse</button>
    </div>
  </div>

  <div class="form-group hidden" id="module-group">
    <label for="module">Module Name</label>
    <input type="text" id="module" placeholder="e.g. uvicorn, pytest" />
  </div>

  <div class="form-group">
    <label for="interpreter">Python Interpreter</label>
    <select id="interpreter-select">
      <option value="selected">Use Selected Interpreter</option>
      <option value="custom">Custom Path</option>
    </select>
  </div>

  <div class="form-group hidden" id="interpreter-path-group">
    <label for="interpreter-path">Interpreter Path</label>
    <div class="form-row">
      <div class="field">
        <input type="text" id="interpreter-path" placeholder="e.g. /usr/bin/python3" />
      </div>
      <button class="browse-btn" id="browse-interpreter">Browse</button>
    </div>
  </div>

  <div class="form-group">
    <label for="args">Arguments</label>
    <input type="text" id="args" placeholder="e.g. --port 8000 --reload" />
  </div>

  <div class="form-group">
    <label for="cwd">Working Directory</label>
    <div class="form-row">
      <div class="field">
        <input type="text" id="cwd" placeholder="\${workspaceFolder}" />
      </div>
      <button class="browse-btn" id="browse-cwd">Browse</button>
    </div>
  </div>

  <div class="form-group">
    <div class="section-label">Environment Variables</div>
    <div id="env-container" class="env-section"></div>
    <button class="add-btn" id="add-env">+ Add Variable</button>
  </div>

  <div class="form-group">
    <label for="terminal">Terminal</label>
    <select id="terminal">
      <option value="integrated">Integrated Terminal</option>
      <option value="external">External Terminal</option>
      <option value="internalConsole">Internal Debug Console</option>
    </select>
  </div>

  <div class="form-group">
    <label for="runMode">Default Run Mode</label>
    <select id="runMode">
      <option value="run">Run</option>
      <option value="debug">Debug</option>
    </select>
  </div>

  <div class="button-bar">
    <button class="secondary-btn" id="cancel-btn">Cancel</button>
    <button class="primary-btn" id="save-btn">Save</button>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      const initialConfig = ${configJson};

      // Elements
      const nameEl = document.getElementById('name');
      const runTypeEl = document.getElementById('runType');
      const scriptGroupEl = document.getElementById('script-group');
      const moduleGroupEl = document.getElementById('module-group');
      const scriptEl = document.getElementById('script');
      const moduleEl = document.getElementById('module');
      const interpreterSelectEl = document.getElementById('interpreter-select');
      const interpreterPathGroupEl = document.getElementById('interpreter-path-group');
      const interpreterPathEl = document.getElementById('interpreter-path');
      const argsEl = document.getElementById('args');
      const cwdEl = document.getElementById('cwd');
      const terminalEl = document.getElementById('terminal');
      const runModeEl = document.getElementById('runMode');
      const envContainer = document.getElementById('env-container');

      function populateForm(config) {
        nameEl.value = config.name || '';
        runTypeEl.value = config.runType || 'script';
        scriptEl.value = config.script || '';
        moduleEl.value = config.module || '';
        argsEl.value = (config.args || []).join(' ');
        cwdEl.value = config.cwd || '\${workspaceFolder}';
        terminalEl.value = config.terminal || 'integrated';
        runModeEl.value = config.runMode || 'run';

        if (config.interpreter && config.interpreter !== 'selected') {
          interpreterSelectEl.value = 'custom';
          interpreterPathEl.value = config.interpreter;
        } else {
          interpreterSelectEl.value = 'selected';
          interpreterPathEl.value = '';
        }

        toggleRunType();
        toggleInterpreter();

        envContainer.innerHTML = '';
        const env = config.env || {};
        const entries = Object.entries(env);
        if (entries.length === 0) {
          addEnvRow('', '');
        } else {
          entries.forEach(([key, value]) => addEnvRow(key, value));
        }
      }

      function toggleRunType() {
        const isScript = runTypeEl.value === 'script';
        scriptGroupEl.classList.toggle('hidden', !isScript);
        moduleGroupEl.classList.toggle('hidden', isScript);
      }

      function toggleInterpreter() {
        const isCustom = interpreterSelectEl.value === 'custom';
        interpreterPathGroupEl.classList.toggle('hidden', !isCustom);
      }

      function addEnvRow(key, value) {
        const row = document.createElement('div');
        row.className = 'env-row';
        row.innerHTML =
          '<input type="text" class="env-key" placeholder="KEY" value="' + escapeHtml(key) + '" />' +
          '<input type="text" class="env-value" placeholder="value" value="' + escapeHtml(value) + '" />' +
          '<button class="remove-btn env-remove">&times;</button>';
        row.querySelector('.env-remove').addEventListener('click', () => {
          row.remove();
        });
        envContainer.appendChild(row);
      }

      function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function collectFormData() {
        const interpreter = interpreterSelectEl.value === 'custom'
          ? interpreterPathEl.value
          : 'selected';

        const argsStr = argsEl.value.trim();
        const args = argsStr ? parseArgs(argsStr) : [];

        const env = {};
        envContainer.querySelectorAll('.env-row').forEach(row => {
          const key = row.querySelector('.env-key').value.trim();
          const val = row.querySelector('.env-value').value;
          if (key) {
            env[key] = val;
          }
        });

        return {
          id: initialConfig.id,
          name: nameEl.value.trim(),
          runType: runTypeEl.value,
          script: scriptEl.value,
          module: moduleEl.value,
          interpreter: interpreter,
          args: args,
          cwd: cwdEl.value || '\${workspaceFolder}',
          env: env,
          terminal: terminalEl.value,
          runMode: runModeEl.value,
          extra: initialConfig.extra || {},
        };
      }

      function parseArgs(str) {
        const args = [];
        let current = '';
        let inQuote = '';
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (inQuote) {
            if (ch === inQuote) {
              inQuote = '';
            } else {
              current += ch;
            }
          } else if (ch === '"' || ch === "'") {
            inQuote = ch;
          } else if (ch === ' ' || ch === '\t') {
            if (current) {
              args.push(current);
              current = '';
            }
          } else {
            current += ch;
          }
        }
        if (current) args.push(current);
        return args;
      }

      // Event listeners
      runTypeEl.addEventListener('change', toggleRunType);
      interpreterSelectEl.addEventListener('change', toggleInterpreter);
      document.getElementById('add-env').addEventListener('click', () => addEnvRow('', ''));

      document.getElementById('save-btn').addEventListener('click', () => {
        const config = collectFormData();
        if (!config.name) {
          nameEl.style.borderColor = 'var(--vscode-inputValidation-errorBorder)';
          nameEl.focus();
          return;
        }
        vscode.postMessage({ command: 'save', config: config });
      });

      document.getElementById('cancel-btn').addEventListener('click', () => {
        vscode.postMessage({ command: 'cancel' });
      });

      document.getElementById('browse-script').addEventListener('click', () => {
        vscode.postMessage({ command: 'browseScript' });
      });

      document.getElementById('browse-interpreter').addEventListener('click', () => {
        vscode.postMessage({ command: 'browseInterpreter' });
      });

      document.getElementById('browse-cwd').addEventListener('click', () => {
        vscode.postMessage({ command: 'browseCwd' });
      });

      // Handle messages from extension
      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
          case 'setFilePath':
            if (message.field === 'script') scriptEl.value = message.path;
            else if (message.field === 'interpreter') interpreterPathEl.value = message.path;
            else if (message.field === 'cwd') cwdEl.value = message.path;
            break;
        }
      });

      // Clear validation on input
      nameEl.addEventListener('input', () => {
        nameEl.style.borderColor = '';
      });

      // Initialize
      populateForm(initialConfig);
    })();
  </script>
</body>
</html>`;
}

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
