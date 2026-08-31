export class ConflictError extends Error {
  constructor() {
    super('too much contention — version conflict after retries');
    this.name = 'ConflictError';
  }
}

/** A version conflict is Mongoose's VersionError (or a Mongo dup-key on a versioned upsert). */
export function isVersionConflict(err: unknown): boolean {
  const e = err as { name?: string; code?: number };
  return e?.name === 'VersionError' || e?.code === 11000;
}

/**
 * Run an optimistic operation, retrying only on version conflicts (with small jittered backoff).
 * Non-conflict errors propagate immediately. Pure/generic so it can be unit-tested with a stub.
 */
export async function retryOnConflict<T>(
  fn: () => Promise<T>,
  attempts = 5,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!isVersionConflict(err)) throw err; // real error → don't retry
      if (i === attempts - 1) break;
      await sleep(Math.floor(Math.random() * 10 * (i + 1))); // jittered backoff
    }
  }
  throw new ConflictError();
}
