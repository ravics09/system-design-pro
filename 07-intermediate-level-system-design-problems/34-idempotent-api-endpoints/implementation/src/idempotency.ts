import { createHash } from 'node:crypto';

/** Stable fingerprint of a request body → detect the same key reused with a different payload. */
export function requestFingerprint(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? null)).digest('hex');
}

export interface StoredKey {
  fingerprint: string;
  status: 'pending' | 'completed';
}

export type Decision = 'replay' | 'in_progress' | 'conflict';

/**
 * Decide what to do when an Idempotency-Key already exists:
 *  - different body fingerprint → 'conflict' (client misuse → 422)
 *  - completed                  → 'replay' (return the stored response)
 *  - still pending              → 'in_progress' (a copy is running → 409/retry)
 * Pure + unit-tested.
 */
export function decideReplay(existing: StoredKey, fingerprint: string): Decision {
  if (existing.fingerprint !== fingerprint) return 'conflict';
  return existing.status === 'completed' ? 'replay' : 'in_progress';
}
