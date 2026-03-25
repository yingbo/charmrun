import * as vscode from 'vscode';
import * as path from 'path';
import { RunConfiguration, createDefaultConfig } from '../types';
import { ConfigStore } from '../configStore';
import { getEditorHtml, getNonce } from './configEditorHtml';

export class ConfigEditorProvider implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private currentFolder: vscode.WorkspaceFolder | undefined;
  private isNew = false;

  constructor(
    private context: vscode.ExtensionContext,
    private configStore: ConfigStore
  ) {}

  async open(
    folder: vscode.WorkspaceFolder,
    config?: RunConfiguration
  ): Promise<void> {
    this.currentFolder = folder;
    this.isNew = !config;
    const editConfig = config ?? createDefaultConfig('New Configuration');

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Active);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'charmrun.configEditor',
        config ? `Edit: ${config.name}` : 'New Run Configuration',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.context.extensionUri, 'media'),
          ],
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      this.panel.webview.onDidReceiveMessage((message) =>
        this.handleMessage(message)
      );
    }

    this.panel.title = config ? `Edit: ${config.name}` : 'New Run Configuration';
    const nonce = getNonce();
    this.panel.webview.html = getEditorHtml(
      this.panel.webview,
      editConfig,
      nonce
    );
  }

  private async handleMessage(message: { command: string; [key: string]: unknown }): Promise<void> {
    switch (message.command) {
      case 'save': {
        const config = message.config as RunConfiguration;
        if (!this.currentFolder) {
          return;
        }
        if (this.isNew) {
          this.configStore.addConfiguration(this.currentFolder, config);
        } else {
          this.configStore.updateConfiguration(this.currentFolder, config);
        }
        this.panel?.dispose();
        break;
      }

      case 'cancel':
        this.panel?.dispose();
        break;

      case 'browseScript': {
        const result = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: { Python: ['py'] },
          defaultUri: this.currentFolder?.uri,
        });
        if (result && result[0] && this.currentFolder) {
          const relativePath = path.relative(
            this.currentFolder.uri.fsPath,
            result[0].fsPath
          );
          this.panel?.webview.postMessage({
            command: 'setFilePath',
            field: 'script',
            path: relativePath,
          });
        }
        break;
      }

      case 'browseInterpreter': {
        const result = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          openLabel: 'Select Python Interpreter',
        });
        if (result && result[0]) {
          this.panel?.webview.postMessage({
            command: 'setFilePath',
            field: 'interpreter',
            path: result[0].fsPath,
          });
        }
        break;
      }

      case 'browseCwd': {
        const result = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select Working Directory',
          defaultUri: this.currentFolder?.uri,
        });
        if (result && result[0]) {
          this.panel?.webview.postMessage({
            command: 'setFilePath',
            field: 'cwd',
            path: result[0].fsPath,
          });
        }
        break;
      }
    }
  }

  dispose(): void {
    this.panel?.dispose();
  }
}
