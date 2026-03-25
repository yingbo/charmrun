import * as vscode from 'vscode';
import { RunConfiguration } from '../types';

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly config: RunConfiguration,
    public readonly folderUri: string,
    public readonly isActive: boolean
  ) {
    super(config.name, vscode.TreeItemCollapsibleState.None);

    this.contextValue = 'runConfiguration';
    this.tooltip = this.buildTooltip();
    this.description = this.buildDescription();

    if (isActive) {
      this.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.green'));
    } else {
      this.iconPath = new vscode.ThemeIcon(
        config.runType === 'module' ? 'package' : 'file-code'
      );
    }
  }

  private buildTooltip(): string {
    const parts = [this.config.name];
    if (this.config.runType === 'script' && this.config.script) {
      parts.push(`Script: ${this.config.script}`);
    } else if (this.config.runType === 'module' && this.config.module) {
      parts.push(`Module: ${this.config.module}`);
    }
    if (this.config.args.length > 0) {
      parts.push(`Args: ${this.config.args.join(' ')}`);
    }
    return parts.join('\n');
  }

  private buildDescription(): string {
    if (this.config.runType === 'script' && this.config.script) {
      return this.config.script;
    }
    if (this.config.runType === 'module' && this.config.module) {
      return `-m ${this.config.module}`;
    }
    return '';
  }
}
