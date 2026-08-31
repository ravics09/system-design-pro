import type { ConfigValue, Env } from './schema';

export interface Snapshot {
  environment: Env;
  overrides: Record<string, ConfigValue>;
  flags: Record<string, boolean>;
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
  snapshot: Snapshot;
}

/** Append-only version log with rollback — every config change is attributable. */
export class VersionHistory {
  private entries: VersionEntry[] = [];
  private seq = 0;

  push(actor: string, action: string, snapshot: Snapshot, diff: DiffEntry[]): VersionEntry {
    this.seq += 1;
    const entry: VersionEntry = {
      version: this.seq,
      at: Date.now(),
      actor,
      action,
      diff,
      snapshot: structuredClone(snapshot),
    };
    this.entries.push(entry);
    return entry;
  }

  list(): VersionEntry[] {
    return this.entries.slice().reverse(); // newest first
  }

  get(version: number): VersionEntry | undefined {
    return this.entries.find((e) => e.version === version);
  }

  current(): number {
    return this.seq;
  }

  reset(): void {
    this.entries = [];
    this.seq = 0;
  }
}
