import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RunConfiguration, ConfigFile, createDefaultConfig, generateId } from './types';

const CONFIG_FILENAME = 'python-run-configs.json';
const ACTIVE_CONFIG_KEY = 'charmrun.activeConfigId';

export class ConfigStore implements vscode.Disposable {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  private fileWatchers: vscode.FileSystemWatcher[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.setupFileWatchers();
  }

  private getConfigPath(folder: vscode.WorkspaceFolder): string {
    return path.join(folder.uri.fsPath, '.vscode', CONFIG_FILENAME);
  }

  getConfigurations(folder: vscode.WorkspaceFolder): RunConfiguration[] {
    const configPath = this.getConfigPath(folder);
    try {
      if (!fs.existsSync(configPath)) {
        return [];
      }
      const content = fs.readFileSync(configPath, 'utf-8');
      const data: ConfigFile = JSON.parse(content);
      return data.configurations || [];
    } catch (e) {
      vscode.window.showWarningMessage(
        `CharmRun: Failed to read config file: ${configPath}`
      );
      return [];
    }
  }

  getAllConfigurations(): { folder: vscode.WorkspaceFolder; configs: RunConfiguration[] }[] {
    const folders = vscode.workspace.workspaceFolders || [];
    return folders.map((folder) => ({
      folder,
      configs: this.getConfigurations(folder),
    }));
  }

  private saveConfigurations(
    folder: vscode.WorkspaceFolder,
    configs: RunConfiguration[]
  ): void {
    const configPath = this.getConfigPath(folder);
    const dir = path.dirname(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data: ConfigFile = {
      version: 1,
      configurations: configs,
    };

    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
    this._onDidChange.fire();
  }

  addConfiguration(
    folder: vscode.WorkspaceFolder,
    config: RunConfiguration
  ): void {
    const configs = this.getConfigurations(folder);
    configs.push(config);
    this.saveConfigurations(folder, configs);
  }

  updateConfiguration(
    folder: vscode.WorkspaceFolder,
    config: RunConfiguration
  ): void {
    const configs = this.getConfigurations(folder);
    const index = configs.findIndex((c) => c.id === config.id);
    if (index >= 0) {
      configs[index] = config;
      this.saveConfigurations(folder, configs);
    }
  }

  deleteConfiguration(
    folder: vscode.WorkspaceFolder,
    configId: string
  ): void {
    const configs = this.getConfigurations(folder);
    const filtered = configs.filter((c) => c.id !== configId);
    this.saveConfigurations(folder, filtered);

    if (this.getActiveConfigId() === configId) {
      this.setActiveConfigId(undefined);
    }
  }

  duplicateConfiguration(
    folder: vscode.WorkspaceFolder,
    configId: string
  ): RunConfiguration | undefined {
    const configs = this.getConfigurations(folder);
    const source = configs.find((c) => c.id === configId);
    if (!source) {
      return undefined;
    }

    const copy: RunConfiguration = {
      ...source,
      id: generateId(),
      name: `${source.name} (Copy)`,
      args: [...source.args],
      env: { ...source.env },
    };
    configs.push(copy);
    this.saveConfigurations(folder, configs);
    return copy;
  }

  findConfigById(configId: string): {
    folder: vscode.WorkspaceFolder;
    config: RunConfiguration;
  } | undefined {
    for (const { folder, configs } of this.getAllConfigurations()) {
      const config = configs.find((c) => c.id === configId);
      if (config) {
        return { folder, config };
      }
    }
    return undefined;
  }

  findConfigFolder(configId: string): vscode.WorkspaceFolder | undefined {
    return this.findConfigById(configId)?.folder;
  }

  getActiveConfigId(): string | undefined {
    return this.context.workspaceState.get<string>(ACTIVE_CONFIG_KEY);
  }

  setActiveConfigId(configId: string | undefined): void {
    this.context.workspaceState.update(ACTIVE_CONFIG_KEY, configId);
    this._onDidChange.fire();
  }

  private setupFileWatchers(): void {
    const watcher = vscode.workspace.createFileSystemWatcher(
      `**/.vscode/${CONFIG_FILENAME}`
    );
    watcher.onDidChange(() => this._onDidChange.fire());
    watcher.onDidCreate(() => this._onDidChange.fire());
    watcher.onDidDelete(() => this._onDidChange.fire());
    this.fileWatchers.push(watcher);
  }

  dispose(): void {
    this._onDidChange.dispose();
    this.fileWatchers.forEach((w) => w.dispose());
  }
}
