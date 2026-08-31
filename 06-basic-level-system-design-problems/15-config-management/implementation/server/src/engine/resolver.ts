import { buildLayers } from './layers';
import { configSchema, type ConfigValue, type Env, type ManagedConfig } from './schema';

export interface Resolved {
  config: ManagedConfig;
  /** key → the name of the highest-precedence layer that supplied it */
  source: Record<string, string>;
}

export class ConfigValidationError extends Error {
  constructor(readonly errors: Record<string, string[]>) {
    super('Config validation failed');
    this.name = 'ConfigValidationError';
  }
}

/**
 * Merge the ordered layers (later wins), tracking which layer supplied each key, then
 * validate + coerce the result. Throws ConfigValidationError if the merged config is
 * invalid — this is the "fail fast" gate.
 */
export function resolveConfig(environment: Env, overrides: Record<string, ConfigValue>): Resolved {
  const merged: Record<string, ConfigValue> = {};
  const source: Record<string, string> = {};

  for (const layer of buildLayers(environment, overrides)) {
    for (const [key, value] of Object.entries(layer.values)) {
      merged[key] = value;
      source[key] = layer.name;
    }
  }

  const parsed = configSchema.safeParse(merged);
  if (!parsed.success) {
    throw new ConfigValidationError(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return { config: parsed.data, source };
}

/** Validate a candidate override set without persisting it. */
export function validateCandidate(
  environment: Env,
  overrides: Record<string, ConfigValue>,
): { ok: true } | { ok: false; errors: Record<string, string[]> } {
  try {
    resolveConfig(environment, overrides);
    return { ok: true };
  } catch (err) {
    if (err instanceof ConfigValidationError) return { ok: false, errors: err.errors };
    throw err;
  }
}
