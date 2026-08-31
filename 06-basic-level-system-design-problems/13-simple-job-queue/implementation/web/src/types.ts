/** Mirrors the server's job/queue types. */
export type JobState = 'waiting' | 'delayed' | 'active' | 'completed' | 'failed' | 'dead';

export const ALL_STATES: JobState[] = [
  'waiting',
  'delayed',
  'active',
  'completed',
  'failed',
  'dead',
];

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  state: JobState;
  attempts: number;
  maxAttempts: number;
  availableAt: number;
  leaseExpiresAt: number | null;
  lastError?: string;
  result?: unknown;
  enqueuedAt: number;
  updatedAt: number;
  finishedAt?: number;
}

export interface QueueStats {
  counts: Record<JobState, number>;
  totals: { enqueued: number; completed: number; retried: number; dead: number; reaped: number };
  oldestWaitingAgeMs: number;
  backlog: number;
}

export interface WorkerStatus {
  paused: boolean;
  concurrency: number;
  inFlight: number;
  pollIntervalMs: number;
  processed: number;
  failed: number;
}

export interface EnqueueBody {
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  delayMs: number;
  maxAttempts: number;
}
