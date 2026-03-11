import * as vscode from 'vscode';
import * as fs from 'fs';
import { execFileSync } from 'child_process';

export class InterpreterResolver {
  async resolve(
    interpreter: string,
    folder: vscode.WorkspaceFolder
  ): Promise<string | undefined> {
    if (interpreter !== 'selected') {
      if (await this.validate(interpreter)) {
        return interpreter;
      }
      vscode.window.showErrorMessage(
        `CharmRun: Interpreter not found: ${interpreter}`
      );
      return undefined;
    }

    // Try the Python extension's interpreter
    try {
      const pythonPath = await vscode.commands.executeCommand<string>(
        'python.interpreterPath',
        { workspaceFolder: folder.uri.toString() }
      );
      if (pythonPath && await this.validate(pythonPath)) {
        return pythonPath;
      }
    } catch {
      // Python extension not available
    }

    // Fallback: read from python config
    const config = vscode.workspace.getConfiguration('python', folder);
    const defaultPath = config.get<string>('defaultInterpreterPath');
    if (defaultPath && await this.validate(defaultPath)) {
      return defaultPath;
    }

    // Fallback: try system python
    for (const cmd of ['python3', 'python']) {
      try {
        const result = execFileSync(cmd, ['--version'], {
          encoding: 'utf-8',
          timeout: 5000,
        });
        if (result) {
          return cmd;
        }
      } catch {
        continue;
      }
    }

    vscode.window.showErrorMessage(
      'CharmRun: No Python interpreter found. Install the Python extension or specify a custom interpreter path.'
    );
    return undefined;
  }

  async validate(interpreterPath: string): Promise<boolean> {
    // Accept simple command names (e.g. 'python3') that would be on PATH
    if (!interpreterPath.includes('/') && !interpreterPath.includes('\\')) {
      try {
        execFileSync(interpreterPath, ['--version'], {
          encoding: 'utf-8',
          timeout: 5000,
        });
        return true;
      } catch {
        return false;
      }
    }
    return fs.existsSync(interpreterPath);
  }
}
