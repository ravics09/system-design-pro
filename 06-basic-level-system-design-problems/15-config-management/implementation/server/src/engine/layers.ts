import type { ConfigValue, Env } from './schema';

export interface Layer {
  name: string;
  /** partial key→value contributions from this source */
  values: Record<string, ConfigValue>;
}

/** Layer 1 — safe baseline defined in code. */
export const DEFAULTS: Record<string, ConfigValue> = {
  APP_NAME: 'system-design-pro',
  PORT: 8080,
  LOG_LEVEL: 'info',
  DATABASE_URL: 'postgres://localhost:5432/app',
  API_KEY: 'sk_test_0000000000',
  MAX_UPLOAD_MB: 10,
  ENABLE_SIGNUP: true,
  REQUEST_TIMEOUT_MS: 30000,
};

/** Layer 2 — per-environment files (local/dev/prod). Only the keys they override. */
export const ENV_FILES: Record<Env, Record<string, ConfigValue>> = {
  local: {
    LOG_LEVEL: 'debug',
    DATABASE_URL: 'postgres://localhost:5432/app_local',
  },
  dev: {
    LOG_LEVEL: 'debug',
    DATABASE_URL: 'postgres://dev-db.internal:5432/app',
    ENABLE_SIGNUP: true,
  },
  prod: {
    LOG_LEVEL: 'warn',
    DATABASE_URL: 'postgres://prod-db.internal:5432/app',
    API_KEY: 'sk_live_injected_by_secrets_manager',
    ENABLE_SIGNUP: false,
    MAX_UPLOAD_MB: 25,
  },
};

/**
 * Layer 3 — environment variables. Deliberately a STRING ("9090") to demonstrate that
 * the schema coerces it to a number, and that env vars override the env file.
 */
export const ENV_VARS: Record<string, ConfigValue> = {
  PORT: '9090',
};

/** Feature-flag defaults (toggled at the runtime layer). */
export const FLAG_DEFAULTS: Record<string, boolean> = {
  new_checkout: false,
  dark_mode: true,
  search_v2: false,
};

/**
 * Build the ordered layer stack (low → high precedence) for an environment plus the
 * current runtime overrides. Later layers win during resolution.
 */
export function buildLayers(environment: Env, overrides: Record<string, ConfigValue>): Layer[] {
  return [
    { name: 'defaults', values: { ...DEFAULTS } },
    { name: `env:${environment}`, values: { ...ENV_FILES[environment] } },
    { name: 'env-vars', values: { ...ENV_VARS } },
    { name: 'runtime', values: { ...overrides } },
  ];
}
