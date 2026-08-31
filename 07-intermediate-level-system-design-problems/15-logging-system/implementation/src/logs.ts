export const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type Level = (typeof LEVELS)[number];

export interface LogEntry {
  ts: Date;
  level: Level;
  service: string;
  traceId: string | null;
  message: string;
  fields: Record<string, unknown>;
}

const SECRET_KEYS = /^(password|passwd|pwd|secret|token|authorization|api[_-]?key|access[_-]?key|card|cvv|pan)$/i;

/** Redact sensitive keys anywhere in a (shallow) fields object — logs are a top leak source. */
export function redactSecrets(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = SECRET_KEYS.test(k) ? '[REDACTED]' : v;
  return out;
}

/** Normalize an untrusted log payload into a stored entry (defaults + validation + redaction). */
export function normalizeLog(raw: Record<string, unknown>): LogEntry {
  const level = (LEVELS as readonly string[]).includes(String(raw.level)) ? (raw.level as Level) : 'info';
  const { level: _l, service: _s, traceId: _t, message: _m, ts: _ts, ...rest } = raw;
  return {
    ts: raw.ts ? new Date(String(raw.ts)) : new Date(),
    level,
    service: String(raw.service ?? 'unknown'),
    traceId: raw.traceId ? String(raw.traceId) : null,
    message: String(raw.message ?? ''),
    fields: redactSecrets(rest),
  };
}
