import * as vscode from 'vscode';
import { ConfigStore } from './configStore';
import { ConfigTreeProvider } from './treeView/configTreeProvider';
import { ConfigEditorProvider } from './webview/configEditorProvider';
import { StatusBarManager } from './statusBar';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  const configStore = new ConfigStore(context);
  const treeProvider = new ConfigTreeProvider(configStore);
  const editorProvider = new ConfigEditorProvider(context, configStore);
  const statusBar = new StatusBarManager(configStore);

  const treeView = vscode.window.createTreeView('charmrun.configurationsView', {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });

  registerCommands(context, configStore, treeProvider, editorProvider, statusBar);

  statusBar.show();

  context.subscriptions.push(treeView, configStore, statusBar, editorProvider);
}

export function deactivate(): void {}
