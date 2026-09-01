import * as vscode from 'vscode';
import * as path from 'path';
import { RunConfiguration, RunMode, generateId } from './types';
import { VariableResolver } from './variableResolver';
import { InterpreterResolver } from './interpreterResolver';
import { ConfigStore } from './configStore';
import { PreRunRunner } from './preRunRunner';

const TERMINAL_MAP: Record<string, string> = {
  integrated: 'integratedTerminal',
  external: 'externalTerminal',
  internalConsole: 'internalConsole',
};

const LAUNCH_TOKEN_KEY = 'charmrunLaunchToken';

export interface ExecuteOptions {
  /** Configuration ids already on the launch stack, used for cycle detection. */
  chain?: Set<string>;
  /** Wait for the debug session to terminate before resolving. */
  waitForExit?: boolean;
}

export class Runner implements vscode.Disposable {
  private interpreterResolver = new InterpreterResolver();
  private output = vscode.window.createOutputChannel('CharmRun Before Launch');
  private preRunRunner: PreRunRunner;

  constructor(private configStore: ConfigStore) {
    this.preRunRunner = new PreRunRunner(
      this.output,
      (configId, folder, chain) => this.executeConfigStep(configId, folder, chain),
      (configId) => this.configStore.findConfigById(configId)?.config.name
    );
  }

  async execute(
    config: RunConfiguration,
    folder: vscode.WorkspaceFolder,
    modeOverride?: RunMode,
    options: ExecuteOptions = {}
  ): Promise<boolean> {
    const errors = this.validate(config);
    if (errors.length > 0) {
      vscode.window.showErrorMessage(
        `CharmRun: ${errors.join('; ')}`
      );
      return false;
    }

    const chain = options.chain ?? new Set<string>();
    if (chain.has(config.id)) {
      vscode.window.showErrorMessage(
        `CharmRun: Circular before-launch reference at "${config.name}".`
      );
      return false;
    }

    const nextChain = new Set(chain).add(config.id);
    const preRunOk = await this.preRunRunner.run(
      config.preRun ?? [],
      folder,
      nextChain
    );
    if (!preRunOk) {
      return false;
    }

    const mode = modeOverride ?? config.runMode;
    const debugConfig = await this.buildDebugConfig(config, folder);
    if (!debugConfig) {
      return false;
    }

    if (!options.waitForExit) {
      return vscode.debug.startDebugging(folder, debugConfig, {
        noDebug: mode === 'run',
      });
    }

    const token = generateId();
    debugConfig[LAUNCH_TOKEN_KEY] = token;
    const terminated = this.waitForSessionExit(token);

    const started = await vscode.debug.startDebugging(folder, debugConfig, {
      noDebug: mode === 'run',
    });
    if (!started) {
      terminated.cancel();
      return false;
    }

    await terminated.promise;
    return true;
  }

  /** Runs a configuration referenced by another config's before-launch step. */
  private async executeConfigStep(
    configId: string,
    folder: vscode.WorkspaceFolder,
    chain: Set<string>
  ): Promise<boolean> {
    const found = this.configStore.findConfigById(configId);
    if (!found) {
      this.output.appendLine(
        `[before launch] Configuration ${configId} no longer exists`
      );
      return false;
    }

    return this.execute(found.config, found.folder, undefined, {
      chain,
      waitForExit: true,
    });
  }

  /**
   * Resolves once the debug session launched with `token` terminates.
   * VS Code exposes no exit code for debug sessions, so a step that runs a
   * configuration succeeds as long as the session started and finished.
   */
  private waitForSessionExit(token: string): {
    promise: Promise<void>;
    cancel: () => void;
  } {
    const disposables: vscode.Disposable[] = [];
    let sessionId: string | undefined;
    let settle: (() => void) | undefined;

    const promise = new Promise<void>((resolve) => {
      settle = () => {
        disposables.forEach((d) => d.dispose());
        resolve();
      };

      disposables.push(
        vscode.debug.onDidStartDebugSession((session) => {
          if (session.configuration[LAUNCH_TOKEN_KEY] === token) {
            sessionId = session.id;
          }
        }),
        vscode.debug.onDidTerminateDebugSession((session) => {
          if (
            session.id === sessionId ||
            session.configuration[LAUNCH_TOKEN_KEY] === token
          ) {
            settle?.();
          }
        })
      );
    });

    return { promise, cancel: () => settle?.() };
  }

  async runCurrentFile(
    folder: vscode.WorkspaceFolder,
    mode: RunMode
  ): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('CharmRun: No active editor.');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    if (!filePath.endsWith('.py')) {
      vscode.window.showErrorMessage(
        'CharmRun: Active file is not a Python file.'
      );
      return;
    }

    const interpreterPath = await this.interpreterResolver.resolve(
      'selected',
      folder
    );
    if (!interpreterPath) {
      return;
    }

    const debugConfig: vscode.DebugConfiguration = {
      name: `Run ${path.basename(filePath)}`,
      type: 'debugpy',
      request: 'launch',
      program: filePath,
      python: interpreterPath,
      cwd: folder.uri.fsPath,
      console: 'integratedTerminal',
      justMyCode: true,
    };

    await vscode.debug.startDebugging(folder, debugConfig, {
      noDebug: mode === 'run',
    });
  }

  private async buildDebugConfig(
    config: RunConfiguration,
    folder: vscode.WorkspaceFolder
  ): Promise<vscode.DebugConfiguration | undefined> {
    const resolver = new VariableResolver(folder);

    const interpreterPath = await this.interpreterResolver.resolve(
      config.interpreter,
      folder
    );
    if (!interpreterPath) {
      return undefined;
    }

    const debugConfig: vscode.DebugConfiguration = {
      ...(config.extra ?? {}),
      name: config.name,
      type: 'debugpy',
      request: 'launch',
      python: interpreterPath,
      args: resolver.resolveArray(config.args),
      cwd: resolver.resolve(config.cwd),
      env: resolver.resolveRecord(config.env),
      console: TERMINAL_MAP[config.terminal] || 'integratedTerminal',
      justMyCode: (config.extra?.justMyCode as boolean | undefined) ?? true,
    };

    if (config.runType === 'script') {
      const scriptPath = resolver.resolve(config.script);
      debugConfig.program = path.isAbsolute(scriptPath)
        ? scriptPath
        : path.join(folder.uri.fsPath, scriptPath);
    } else {
      debugConfig.module = config.module;
    }

    if (config.envFile && config.envFile.trim()) {
      const envFilePath = resolver.resolve(config.envFile.trim());
      debugConfig.envFile = path.isAbsolute(envFilePath)
        ? envFilePath
        : path.join(folder.uri.fsPath, envFilePath);
    }

    return debugConfig;
  }

  private validate(config: RunConfiguration): string[] {
    const errors: string[] = [];

    if (!config.name.trim()) {
      errors.push('Configuration name is required');
    }

    if (config.runType === 'script' && !config.script.trim()) {
      errors.push('Script path is required');
    }

    if (config.runType === 'module' && !config.module.trim()) {
      errors.push('Module name is required');
    }

    return errors;
  }

  dispose(): void {
    this.output.dispose();
  }
}
