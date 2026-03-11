import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RunConfiguration, RunMode } from './types';
import { VariableResolver } from './variableResolver';
import { InterpreterResolver } from './interpreterResolver';

const TERMINAL_MAP: Record<string, string> = {
  integrated: 'integratedTerminal',
  external: 'externalTerminal',
  internalConsole: 'internalConsole',
};

export class Runner {
  private interpreterResolver = new InterpreterResolver();

  async execute(
    config: RunConfiguration,
    folder: vscode.WorkspaceFolder,
    modeOverride?: RunMode
  ): Promise<void> {
    const errors = this.validate(config);
    if (errors.length > 0) {
      vscode.window.showErrorMessage(
        `CharmRun: ${errors.join('; ')}`
      );
      return;
    }

    const mode = modeOverride ?? config.runMode;
    const debugConfig = await this.buildDebugConfig(config, folder);
    if (!debugConfig) {
      return;
    }

    await vscode.debug.startDebugging(folder, debugConfig, {
      noDebug: mode === 'run',
    });
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
      name: config.name,
      type: 'debugpy',
      request: 'launch',
      python: interpreterPath,
      args: resolver.resolveArray(config.args),
      cwd: resolver.resolve(config.cwd),
      env: resolver.resolveRecord(config.env),
      console: TERMINAL_MAP[config.terminal] || 'integratedTerminal',
      justMyCode: true,
    };

    if (config.runType === 'script') {
      const scriptPath = resolver.resolve(config.script);
      debugConfig.program = path.isAbsolute(scriptPath)
        ? scriptPath
        : path.join(folder.uri.fsPath, scriptPath);
    } else {
      debugConfig.module = config.module;
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
}
