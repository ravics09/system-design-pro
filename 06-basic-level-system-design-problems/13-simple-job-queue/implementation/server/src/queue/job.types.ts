import { z } from 'zod';

/**
 * Job lifecycle states.
 *  waiting   → eligible to be leased now
 *  delayed   → scheduled for the future (delay or retry backoff); becomes waiting at availableAt
 *  active    → leased by a worker (invisible to others until the lease expires)
 *  completed → processed successfully
 *  failed    → last attempt failed but retries remain (transient; usually re-enters `delayed`)
 *  dead      → exhausted maxAttempts → parked in the dead-letter queue
 */
export type JobState = 'waiting' | 'delayed' | 'active' | 'completed' | 'failed' | 'dead';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  state: JobState;
  attempts: number;
  maxAttempts: number;
  /** epoch ms; a job is only leasable when availableAt <= now (drives delay + backoff). */
  availableAt: number;
  /** epoch ms while `active`; the lease expiry the reaper watches. null otherwise. */
  leaseExpiresAt: number | null;
  lastError?: string;
  result?: unknown;
  enqueuedAt: number;
  updatedAt: number;
  finishedAt?: number;
}

export interface EnqueueOptions {
  priority?: number;
  delayMs?: number;
  maxAttempts?: number;
}

/** Validation schema for the enqueue request body. */
export const enqueueSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.record(z.unknown()).default({}),
  priority: z.coerce.number().int().min(-100).max(100).default(0),
  delayMs: z.coerce.number().int().nonnegative().max(86_400_000).default(0),
  maxAttempts: z.coerce.number().int().positive().max(20).default(3),
});

export type EnqueueInput = z.infer<typeof enqueueSchema>;

export const ALL_STATES: JobState[] = [
  'waiting',
  'delayed',
  'active',
  'completed',
  'failed',
  'dead',
];

export interface QueueStats {
  counts: Record<JobState, number>;
  /** cumulative counters since last reset */
  totals: { enqueued: number; completed: number; retried: number; dead: number; reaped: number };
  /** age in ms of the oldest job still waiting to be processed (0 if none) */
  oldestWaitingAgeMs: number;
  /** waiting + delayed + active — the live backlog used for backpressure */
  backlog: number;
}
