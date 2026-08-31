import { FLAG_DEFAULTS, buildLayers } from './layers';
import { ConfigValidationError, resolveConfig, validateCandidate } from './resolver';
import { CONFIG_KEYS, SECRET_KEYS, maskConfig, maskSecret, type ConfigValue, type Env } from './schema';
import { VersionHistory, type DiffEntry, type Snapshot } from './history';

export class UnknownFlagError extends Error {}

/**
 * Orchestrates the config lifecycle: holds the active environment, the mutable runtime
 * override layer, and feature flags; resolves + validates on every change; and records a
 * versioned, diffable audit trail with rollback.
 */
export class ConfigEngine {
  private environment: Env;
  private overrides: Record<string, ConfigValue> = {};
  private flags: Record<string, boolean> = { ...FLAG_DEFAULTS };
  private readonly history = new VersionHistory();
  private lastCombined: Record<string, ConfigValue> = {};

  constructor(initialEnv: Env) {
    this.environment = initialEnv;
    this.record('system', `initial config (${initialEnv})`);
  }

  // ── reads ────────────────────────────────────────────────────────────────
  getResolved(reveal = false) {
    const { config, source } = resolveConfig(this.environment, this.overrides);
    return {
      environment: this.environment,
      config: maskConfig(config, reveal),
      source,
      flags: { ...this.flags },
      version: this.history.current(),
      revealed: reveal,
    };
  }

  /** Per-layer breakdown (masked) so you can see exactly what each source contributes. */
  getLayers(reveal = false) {
    return buildLayers(this.environment, this.overrides).map((layer) => ({
      name: layer.name,
      values: Object.fromEntries(
        Object.entries(layer.values).map(([k, v]) => [k, SECRET_KEYS.has(k) && !reveal ? maskSecret(v) : v]),
      ),
    }));
  }

  flagsView(): Record<string, boolean> {
    return { ...this.flags };
  }

  versions() {
    return this.history.list();
  }

  // ── writes (validated + audited) ───────────────────────────────────────────
  setEnvironment(environment: Env, actor: string) {
    this.environment = environment;
    this.record(actor, `switch environment → ${environment}`);
    return this.getResolved(false);
  }

  setOverride(key: string, value: ConfigValue, actor: string) {
    if (!CONFIG_KEYS.includes(key as never)) {
      throw new ConfigValidationError({ [key]: ['unknown config key'] });
    }
    const candidate = { ...this.overrides, [key]: value };
    const check = validateCandidate(this.environment, candidate);
    if (!check.ok) throw new ConfigValidationError(check.errors);
    this.overrides = candidate;
    this.record(actor, `set override ${key}`);
    return this.getResolved(false);
  }

  clearOverride(key: string, actor: string) {
    if (key in this.overrides) {
      delete this.overrides[key];
      this.record(actor, `clear override ${key}`);
    }
    return this.getResolved(false);
  }

  validate(overrides: Record<string, ConfigValue>) {
    return validateCandidate(this.environment, { ...this.overrides, ...overrides });
  }

  setFlag(name: string, value: boolean, actor: string) {
    if (!(name in this.flags)) throw new UnknownFlagError(`Unknown flag '${name}'`);
    this.flags[name] = value;
    this.record(actor, `flag ${name} → ${value}`);
    return this.flagsView();
  }

  rollback(version: number, actor: string) {
    const entry = this.history.get(version);
    if (!entry) return null;
    const snap = entry.snapshot;
    this.environment = snap.environment;
    this.overrides = { ...snap.overrides };
    this.flags = { ...snap.flags };
    this.record(actor, `rollback → v${version}`);
    return this.getResolved(false);
  }

  reset() {
    this.environment = this.environment; // keep active env
    this.overrides = {};
    this.flags = { ...FLAG_DEFAULTS };
    this.history.reset();
    this.lastCombined = {};
    this.record('system', 'reset to defaults');
    return this.getResolved(false);
  }

  // ── internal ────────────────────────────────────────────────────────────────
  /** Effective config + flags in one map (flags prefixed), with secrets masked for the log. */
  private combined(): Record<string, ConfigValue> {
    const { config } = resolveConfig(this.environment, this.overrides);
    const masked = maskConfig(config, false);
    const out: Record<string, ConfigValue> = { ...masked };
    for (const [k, v] of Object.entries(this.flags)) out[`flag:${k}`] = v;
    return out;
  }

  private record(actor: string, action: string): void {
    const next = this.combined();
    const diff: DiffEntry[] = [];
    const keys = new Set([...Object.keys(this.lastCombined), ...Object.keys(next)]);
    for (const k of keys) {
      if (String(this.lastCombined[k]) !== String(next[k])) {
        diff.push({ key: k, from: this.lastCombined[k], to: next[k] });
      }
    }
    const snapshot: Snapshot = {
      environment: this.environment,
      overrides: { ...this.overrides },
      flags: { ...this.flags },
    };
    this.history.push(actor, action, snapshot, diff);
    this.lastCombined = next;
  }
}
