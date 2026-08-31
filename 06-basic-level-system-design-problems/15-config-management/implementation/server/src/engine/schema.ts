import { z } from 'zod';

export type Env = 'local' | 'dev' | 'prod';
export type ConfigValue = string | number | boolean;

/** A boolean that also accepts the strings "true"/"false" (env vars are strings). */
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

/**
 * The schema of the config we manage. Coercion turns stringly-typed env-var values into
 * real types (so `PORT="9090"` becomes a number and `"false"` becomes boolean false),
 * and validation fails fast on anything malformed.
 */
export const configSchema = z.object({
  APP_NAME: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  DATABASE_URL: z.string().min(1),
  API_KEY: z.string().min(1),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(1024),
  ENABLE_SIGNUP: boolish,
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive(),
});

export type ManagedConfig = z.infer<typeof configSchema>;

export interface KeyMeta {
  key: keyof ManagedConfig;
  type: 'string' | 'number' | 'boolean' | 'enum';
  secret: boolean;
  enumValues?: string[];
  description: string;
}

/** Metadata for the UI + secret marking. */
export const KEY_META: KeyMeta[] = [
  { key: 'APP_NAME', type: 'string', secret: false, description: 'Application display name' },
  { key: 'PORT', type: 'number', secret: false, description: 'HTTP listen port' },
  { key: 'LOG_LEVEL', type: 'enum', secret: false, enumValues: ['debug', 'info', 'warn', 'error'], description: 'Logging verbosity' },
  { key: 'DATABASE_URL', type: 'string', secret: true, description: 'Database connection string (secret)' },
  { key: 'API_KEY', type: 'string', secret: true, description: 'Third-party API key (secret)' },
  { key: 'MAX_UPLOAD_MB', type: 'number', secret: false, description: 'Max upload size in MB' },
  { key: 'ENABLE_SIGNUP', type: 'boolean', secret: false, description: 'Allow new user signups' },
  { key: 'REQUEST_TIMEOUT_MS', type: 'number', secret: false, description: 'Upstream request timeout' },
];

export const CONFIG_KEYS = KEY_META.map((k) => k.key);
export const SECRET_KEYS = new Set<string>(KEY_META.filter((k) => k.secret).map((k) => k.key));

/** Mask a secret so it never leaks in a response/log: keep only a short suffix. */
export function maskSecret(value: ConfigValue): string {
  const s = String(value);
  if (s.length <= 4) return '••••';
  return '••••' + s.slice(-4);
}

/** Return a copy with secret keys masked, unless `reveal` is true. */
export function maskConfig<T extends Record<string, ConfigValue>>(cfg: T, reveal: boolean): Record<string, ConfigValue> {
  if (reveal) return { ...cfg };
  const out: Record<string, ConfigValue> = {};
  for (const [k, v] of Object.entries(cfg)) out[k] = SECRET_KEYS.has(k) ? maskSecret(v) : v;
  return out;
}
