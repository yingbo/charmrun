export type RunType = 'script' | 'module';
export type TerminalType = 'integrated' | 'external' | 'internalConsole';
export type RunMode = 'run' | 'debug';

export interface RunConfiguration {
  id: string;
  name: string;
  runType: RunType;
  script: string;
  module: string;
  interpreter: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  terminal: TerminalType;
  runMode: RunMode;
}

export interface ConfigFile {
  version: 1;
  configurations: RunConfiguration[];
}

export function createDefaultConfig(name: string): RunConfiguration {
  return {
    id: generateId(),
    name,
    runType: 'script',
    script: '',
    module: '',
    interpreter: 'selected',
    args: [],
    cwd: '${workspaceFolder}',
    env: {},
    terminal: 'integrated',
    runMode: 'run',
  };
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
