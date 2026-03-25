import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parse, ParseError } from 'jsonc-parser/lib/esm/main.js';
import { RunConfiguration, generateId } from './types';

const CONFIG_FILENAME = 'launch.json';
const ACTIVE_CONFIG_KEY = 'charmrun.activeConfigId';
const CHARMRUN_MANAGED_KEY = 'charmrunManaged';
const CHARMRUN_ID_KEY = 'charmrunId';
const CHARMRUN_RUN_MODE_KEY = 'charmrunRunMode';

type LaunchJsonFile = {
  version: string;
  configurations: LaunchConfiguration[];
};

type LaunchConfiguration = Record<string, unknown> & {
  name?: string;
  type?: string;
  request?: string;
  program?: string;
  module?: string;
  python?: string;
  args?: unknown;
  cwd?: string;
  env?: Record<string, unknown>;
  console?: string;
  noDebug?: boolean;
  charmrunManaged?: boolean;
  charmrunId?: string;
  charmrunRunMode?: string;
};

export type AdoptableConfiguration = {
  folder: vscode.WorkspaceFolder;
  config: RunConfiguration;
  entryIndex: number;
};

const KNOWN_DEBUG_KEYS = new Set([
  'name',
  'type',
  'request',
  'program',
  'module',
  'python',
  'args',
  'cwd',
  'env',
  'console',
  'noDebug',
  CHARMRUN_MANAGED_KEY,
  CHARMRUN_ID_KEY,
  CHARMRUN_RUN_MODE_KEY,
]);

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
    return this.readLaunchFile(folder).configurations
      .map((entry) => this.toManagedRunConfiguration(entry))
      .filter((config): config is RunConfiguration => Boolean(config));
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
    const launchFile = this.readLaunchFile(folder);
    const managedEntries = configs.map((config) =>
      this.toLaunchConfiguration(config)
    );

    launchFile.configurations = [
      ...launchFile.configurations.filter((entry) => !this.isCharmRunManaged(entry)),
      ...managedEntries,
    ];

    this.writeLaunchFile(folder, launchFile);
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
      extra: { ...(source.extra ?? {}) },
    };
    configs.push(copy);
    this.saveConfigurations(folder, configs);
    return copy;
  }

  getAdoptableConfigurations(): AdoptableConfiguration[] {
    const folders = vscode.workspace.workspaceFolders || [];
    const adoptable: AdoptableConfiguration[] = [];

    for (const folder of folders) {
      const launchFile = this.readLaunchFile(folder);
      launchFile.configurations.forEach((entry, index) => {
        if (!this.isAdoptable(entry)) {
          return;
        }

        const config = this.toRunConfiguration(entry, `adopt:${folder.index}:${index}`);
        if (!config) {
          return;
        }

        adoptable.push({
          folder,
          config,
          entryIndex: index,
        });
      });
    }

    return adoptable;
  }

  adoptConfiguration(
    folder: vscode.WorkspaceFolder,
    entryIndex: number
  ): RunConfiguration | undefined {
    const launchFile = this.readLaunchFile(folder);
    const entry = launchFile.configurations[entryIndex];
    if (!entry || !this.isAdoptable(entry)) {
      return undefined;
    }

    const adopted = this.toRunConfiguration(entry, generateId());
    if (!adopted) {
      return undefined;
    }

    launchFile.configurations[entryIndex] = this.toLaunchConfiguration(adopted);
    this.writeLaunchFile(folder, launchFile);
    this._onDidChange.fire();
    return adopted;
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

  private readLaunchFile(folder: vscode.WorkspaceFolder): LaunchJsonFile {
    const configPath = this.getConfigPath(folder);
    if (!fs.existsSync(configPath)) {
      return {
        version: '0.2.0',
        configurations: [],
      };
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const errors: ParseError[] = [];
      const parsed = parse(content, errors) as Partial<LaunchJsonFile> | undefined;

      if (errors.length > 0 || !parsed || typeof parsed !== 'object') {
        throw new Error('Invalid launch.json');
      }

      return {
        version: typeof parsed.version === 'string' ? parsed.version : '0.2.0',
        configurations: Array.isArray(parsed.configurations)
          ? parsed.configurations.filter(
              (entry): entry is LaunchConfiguration =>
                Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)
            )
          : [],
      };
    } catch {
      vscode.window.showWarningMessage(
        `CharmRun: Failed to read launch config: ${configPath}`
      );
      return {
        version: '0.2.0',
        configurations: [],
      };
    }
  }

  private writeLaunchFile(
    folder: vscode.WorkspaceFolder,
    launchFile: LaunchJsonFile
  ): void {
    const configPath = this.getConfigPath(folder);
    const dir = path.dirname(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      configPath,
      `${JSON.stringify(launchFile, null, 2)}\n`,
      'utf-8'
    );
  }

  private isPythonLaunchConfig(entry: LaunchConfiguration): boolean {
    return entry.type === 'debugpy' && entry.request === 'launch';
  }

  private isCharmRunManaged(entry: LaunchConfiguration): boolean {
    return entry[CHARMRUN_MANAGED_KEY] === true
      && typeof entry[CHARMRUN_ID_KEY] === 'string'
      && entry[CHARMRUN_ID_KEY].trim().length > 0;
  }

  private isAdoptable(entry: LaunchConfiguration): boolean {
    return this.isPythonLaunchConfig(entry) && !this.isCharmRunManaged(entry);
  }

  private toManagedRunConfiguration(
    entry: LaunchConfiguration
  ): RunConfiguration | undefined {
    if (!this.isCharmRunManaged(entry)) {
      return undefined;
    }

    return this.toRunConfiguration(entry, entry[CHARMRUN_ID_KEY]);
  }

  private toRunConfiguration(
    entry: LaunchConfiguration,
    id: unknown
  ): RunConfiguration | undefined {
    if (!this.isPythonLaunchConfig(entry) || typeof id !== 'string' || !id.trim()) {
      return undefined;
    }

    const program = typeof entry.program === 'string' ? entry.program : '';
    const moduleName = typeof entry.module === 'string' ? entry.module : '';
    const runType = moduleName.trim() ? 'module' : 'script';
    const args = Array.isArray(entry.args)
      ? entry.args.map((value) => String(value))
      : [];
    const envObject = entry.env && typeof entry.env === 'object'
      ? entry.env
      : {};
    const env = Object.fromEntries(
      Object.entries(envObject)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    );

    return {
      id,
      name: typeof entry.name === 'string' && entry.name.trim()
        ? entry.name
        : 'Unnamed Configuration',
      runType,
      script: runType === 'script' ? program : '',
      module: runType === 'module' ? moduleName : '',
      interpreter: typeof entry.python === 'string' && entry.python.trim()
        ? entry.python
        : 'selected',
      args,
      cwd: typeof entry.cwd === 'string' && entry.cwd.trim()
        ? entry.cwd
        : '${workspaceFolder}',
      env,
      terminal: this.fromLaunchConsole(entry.console),
      runMode: this.fromLaunchRunMode(entry),
      extra: this.extractExtraFields(entry),
    };
  }

  private toLaunchConfiguration(config: RunConfiguration): LaunchConfiguration {
    const launchConfig: LaunchConfiguration = {
      ...(config.extra ?? {}),
      name: config.name,
      type: 'debugpy',
      request: 'launch',
      args: [...config.args],
      cwd: config.cwd,
      env: { ...config.env },
      console: this.toLaunchConsole(config.terminal),
      justMyCode: (config.extra?.justMyCode as boolean | undefined) ?? true,
      [CHARMRUN_MANAGED_KEY]: true,
      [CHARMRUN_ID_KEY]: config.id,
      [CHARMRUN_RUN_MODE_KEY]: config.runMode,
    };

    if (config.runType === 'script') {
      launchConfig.program = config.script;
    } else {
      launchConfig.module = config.module;
    }

    if (config.interpreter !== 'selected') {
      launchConfig.python = config.interpreter;
    }

    return launchConfig;
  }

  private fromLaunchConsole(value: unknown): RunConfiguration['terminal'] {
    switch (value) {
      case 'externalTerminal':
        return 'external';
      case 'internalConsole':
        return 'internalConsole';
      default:
        return 'integrated';
    }
  }

  private toLaunchConsole(value: RunConfiguration['terminal']): string {
    switch (value) {
      case 'external':
        return 'externalTerminal';
      case 'internalConsole':
        return 'internalConsole';
      default:
        return 'integratedTerminal';
    }
  }

  private fromLaunchRunMode(entry: LaunchConfiguration): RunConfiguration['runMode'] {
    if (entry[CHARMRUN_RUN_MODE_KEY] === 'run' || entry.noDebug === true) {
      return 'run';
    }
    return 'debug';
  }

  private extractExtraFields(
    entry: LaunchConfiguration
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(entry).filter(([key]) => !KNOWN_DEBUG_KEYS.has(key))
    );
  }
}
