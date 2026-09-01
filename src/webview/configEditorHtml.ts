import * as vscode from 'vscode';
import { RunConfiguration } from '../types';

export interface EditorContext {
  /** Other CharmRun configurations that a before-launch step can run. */
  availableConfigs: { id: string; name: string }[];
  /** Task labels available in the workspace. */
  availableTasks: string[];
}

export function getEditorHtml(
  webview: vscode.Webview,
  config: RunConfiguration,
  nonce: string,
  context: EditorContext
): string {
  const configJson = toScriptJson(config);
  const availableConfigsJson = toScriptJson(context.availableConfigs);
  const availableTasksJson = toScriptJson(context.availableTasks);

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
    .prerun-row {
      border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.35));
      border-radius: 2px;
      padding: 8px;
      margin-bottom: 8px;
    }
    .prerun-head {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .prerun-head select {
      flex: 1;
    }
    .prerun-head input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    .prerun-fields {
      margin-top: 8px;
    }
    .prerun-fields label {
      display: block;
      margin: 6px 0 4px 0;
      font-size: 11px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }
    .prerun-empty {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      margin-bottom: 8px;
    }
    .icon-btn {
      padding: 4px 8px;
      background: transparent;
      color: var(--vscode-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }
    .icon-btn:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2));
    }
    .icon-btn:disabled {
      opacity: 0.4;
      cursor: default;
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
    <label for="envFile">Env File</label>
    <div class="form-row">
      <div class="field">
        <input type="text" id="envFile" placeholder="e.g. \${workspaceFolder}/.env" />
      </div>
      <button class="browse-btn" id="browse-env-file">Browse</button>
    </div>
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

  <div class="form-group">
    <div class="section-label">Before Launch</div>
    <div id="prerun-container"></div>
    <div class="form-row">
      <div class="field">
        <select id="prerun-type">
          <option value="configuration">Run another configuration</option>
          <option value="externalTool">Run external tool</option>
          <option value="task">Run task</option>
        </select>
      </div>
      <button class="add-btn" id="add-prerun">+ Add Step</button>
    </div>
  </div>

  <div class="button-bar">
    <button class="secondary-btn" id="cancel-btn">Cancel</button>
    <button class="primary-btn" id="save-btn">Save</button>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      const initialConfig = ${configJson};
      const availableConfigs = ${availableConfigsJson};
      const availableTasks = ${availableTasksJson};
      let preRunSteps = [];

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
      const envFileEl = document.getElementById('envFile');
      const preRunContainer = document.getElementById('prerun-container');
      const preRunTypeEl = document.getElementById('prerun-type');

      function populateForm(config) {
        nameEl.value = config.name || '';
        runTypeEl.value = config.runType || 'script';
        scriptEl.value = config.script || '';
        moduleEl.value = config.module || '';
        argsEl.value = (config.args || []).join(' ');
        cwdEl.value = config.cwd || '\${workspaceFolder}';
        envFileEl.value = config.envFile || '';
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

        preRunSteps = (config.preRun || []).map(step => ({
          id: step.id,
          type: step.type,
          enabled: step.enabled !== false,
          configId: step.configId || '',
          command: step.command || '',
          argsText: (step.args || []).join(' '),
          cwd: step.cwd || '',
          task: step.task || '',
        }));
        renderPreRun();

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

      function makeId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      function renderPreRun() {
        preRunContainer.innerHTML = '';

        if (preRunSteps.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'prerun-empty';
          empty.textContent = 'No before-launch steps. Steps run in order, top to bottom.';
          preRunContainer.appendChild(empty);
          return;
        }

        preRunSteps.forEach((step, index) => {
          preRunContainer.appendChild(buildPreRunRow(step, index));
        });
      }

      function buildPreRunRow(step, index) {
        const row = document.createElement('div');
        row.className = 'prerun-row';

        const head = document.createElement('div');
        head.className = 'prerun-head';

        const enabledEl = document.createElement('input');
        enabledEl.type = 'checkbox';
        enabledEl.checked = step.enabled;
        enabledEl.title = 'Enable this step';
        enabledEl.addEventListener('change', () => {
          step.enabled = enabledEl.checked;
        });

        const typeEl = document.createElement('select');
        [
          ['configuration', 'Run another configuration'],
          ['externalTool', 'Run external tool'],
          ['task', 'Run task'],
        ].forEach(([value, label]) => {
          typeEl.appendChild(makeOption(value, label));
        });
        typeEl.value = step.type;
        typeEl.addEventListener('change', () => {
          step.type = typeEl.value;
          renderPreRun();
        });

        head.appendChild(enabledEl);
        head.appendChild(typeEl);
        head.appendChild(makeIconButton('\u25B2', 'Move up', index === 0, () => movePreRunStep(index, -1)));
        head.appendChild(makeIconButton('\u25BC', 'Move down', index === preRunSteps.length - 1, () => movePreRunStep(index, 1)));
        head.appendChild(makeIconButton('\u00D7', 'Remove step', false, () => {
          preRunSteps.splice(index, 1);
          renderPreRun();
        }));

        const fields = document.createElement('div');
        fields.className = 'prerun-fields';
        buildPreRunFields(step, fields);

        row.appendChild(head);
        row.appendChild(fields);
        return row;
      }

      function buildPreRunFields(step, container) {
        if (step.type === 'configuration') {
          if (availableConfigs.length === 0 && !step.configId) {
            const note = document.createElement('div');
            note.className = 'prerun-empty';
            note.textContent = 'No other configurations in this workspace folder yet.';
            container.appendChild(note);
            return;
          }

          const select = document.createElement('select');
          select.appendChild(makeOption('', 'Select a configuration...'));
          availableConfigs.forEach(item => {
            select.appendChild(makeOption(item.id, item.name));
          });
          if (step.configId && !availableConfigs.some(item => item.id === step.configId)) {
            select.appendChild(makeOption(step.configId, 'Unknown configuration (' + step.configId + ')'));
          }
          select.value = step.configId || '';
          select.addEventListener('change', () => {
            step.configId = select.value;
          });
          container.appendChild(makeLabel('Configuration'));
          container.appendChild(select);
          return;
        }

        if (step.type === 'task') {
          if (availableTasks.length > 0) {
            const select = document.createElement('select');
            select.appendChild(makeOption('', 'Select a task...'));
            availableTasks.forEach(label => select.appendChild(makeOption(label, label)));
            if (step.task && availableTasks.indexOf(step.task) === -1) {
              select.appendChild(makeOption(step.task, step.task));
            }
            select.value = step.task || '';
            select.addEventListener('change', () => {
              step.task = select.value;
            });
            container.appendChild(makeLabel('Task'));
            container.appendChild(select);
            return;
          }

          container.appendChild(makeLabel('Task Label'));
          container.appendChild(makeTextInput(step.task, 'e.g. build', value => {
            step.task = value;
          }));
          return;
        }

        container.appendChild(makeLabel('Command'));
        container.appendChild(makeTextInput(step.command, 'e.g. npm', value => {
          step.command = value;
        }));
        container.appendChild(makeLabel('Arguments'));
        container.appendChild(makeTextInput(step.argsText, 'e.g. run build', value => {
          step.argsText = value;
        }));
        container.appendChild(makeLabel('Working Directory'));
        container.appendChild(makeTextInput(step.cwd, '\${workspaceFolder}', value => {
          step.cwd = value;
        }));
      }

      function movePreRunStep(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= preRunSteps.length) {
          return;
        }
        const [step] = preRunSteps.splice(index, 1);
        preRunSteps.splice(target, 0, step);
        renderPreRun();
      }

      function makeOption(value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
      }

      function makeLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
      }

      function makeTextInput(value, placeholder, onChange) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';
        input.placeholder = placeholder;
        input.addEventListener('input', () => onChange(input.value));
        return input;
      }

      function makeIconButton(text, title, disabled, onClick) {
        const button = document.createElement('button');
        button.className = 'icon-btn';
        button.textContent = text;
        button.title = title;
        button.disabled = disabled;
        button.addEventListener('click', onClick);
        return button;
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
          envFile: envFileEl.value.trim(),
          terminal: terminalEl.value,
          runMode: runModeEl.value,
          preRun: preRunSteps.map(step => ({
            id: step.id,
            type: step.type,
            enabled: step.enabled,
            configId: step.configId,
            command: step.command,
            args: step.argsText.trim() ? parseArgs(step.argsText.trim()) : [],
            cwd: step.cwd,
            task: step.task,
          })),
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

      document.getElementById('add-prerun').addEventListener('click', () => {
        preRunSteps.push({
          id: makeId(),
          type: preRunTypeEl.value,
          enabled: true,
          configId: '',
          command: '',
          argsText: '',
          cwd: '\${workspaceFolder}',
          task: '',
        });
        renderPreRun();
      });

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

      document.getElementById('browse-env-file').addEventListener('click', () => {
        vscode.postMessage({ command: 'browseEnvFile' });
      });

      // Handle messages from extension
      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
          case 'setFilePath':
            if (message.field === 'script') scriptEl.value = message.path;
            else if (message.field === 'interpreter') interpreterPathEl.value = message.path;
            else if (message.field === 'cwd') cwdEl.value = message.path;
            else if (message.field === 'envFile') envFileEl.value = message.path;
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

function toScriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
