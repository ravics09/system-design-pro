import type { Job } from './job.types';

/** A processor runs a job and either resolves (success) or throws (failure → retry/DLQ). */
export type Processor = (job: Job) => Promise<unknown>;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function num(payload: Record<string, unknown>, key: string, fallback: number): number {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/**
 * Demo handler that lets the UI drive queue behavior through the payload:
 *   - latencyMs   simulated work duration (default 50)
 *   - alwaysFail  throw on every attempt → drives the retry → DLQ path
 *   - failTimes   fail while `attempts <= failTimes`, then succeed → drives retry → success
 *
 * Note it reads `job.attempts` (incremented on each lease), so it's naturally
 * idempotency-aware: a real handler would dedupe side effects on `job.id`.
 */
const demoHandler: Processor = async (job) => {
  const p = job.payload ?? {};
  await sleep(num(p, 'latencyMs', 50));

  if (p.alwaysFail === true) {
    throw new Error('processor: alwaysFail=true (poison job)');
  }
  const failTimes = num(p, 'failTimes', 0);
  if (job.attempts <= failTimes) {
    throw new Error(`processor: simulated transient failure (attempt ${job.attempts} of ${failTimes})`);
  }
  return { ok: true, type: job.type, attempts: job.attempts, processedAt: Date.now() };
};

/** An email-ish handler that always succeeds after a short delay. */
const emailHandler: Processor = async (job) => {
  await sleep(num(job.payload ?? {}, 'latencyMs', 80));
  return { ok: true, sentTo: job.payload?.to ?? 'unknown', at: Date.now() };
};

/**
 * Registered processors keyed by job `type`. In production this is your allowlist of
 * safe handlers — never execute an arbitrary type from an untrusted producer.
 */
export const processors: Record<string, Processor> = {
  demo: demoHandler,
  email: emailHandler,
};

export const KNOWN_TYPES = Object.keys(processors);

/** Resolve a handler for a type, defaulting to the demo handler for the sandbox. */
export function getProcessor(type: string): Processor {
  return processors[type] ?? demoHandler;
}
