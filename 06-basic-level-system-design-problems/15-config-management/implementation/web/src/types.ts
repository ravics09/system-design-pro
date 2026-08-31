export type Env = 'local' | 'dev' | 'prod';
export type ConfigValue = string | number | boolean;

export interface Resolved {
  environment: Env;
  config: Record<string, ConfigValue>;
  source: Record<string, string>;
  flags: Record<string, boolean>;
  version: number;
  revealed: boolean;
}

export interface Layer {
  name: string;
  values: Record<string, ConfigValue>;
}

export interface KeyMeta {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  secret: boolean;
  enumValues?: string[];
  description: string;
}

export interface DiffEntry {
  key: string;
  from: ConfigValue | undefined;
  to: ConfigValue | undefined;
}

export interface VersionEntry {
  version: number;
  at: number;
  actor: string;
  action: string;
  diff: DiffEntry[];
}
