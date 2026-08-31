import { randomUUID } from 'node:crypto';
import {
  ALL_STATES,
  type EnqueueOptions,
  type Job,
  type JobState,
  type QueueStats,
} from './job.types';

export interface JobQueueConfig {
  visibilityTimeoutMs: number;
  backoffBaseMs: number;
  backoffCapMs: number;
  maxQueueDepth: number;
}

/** Thrown when the backlog is full — the producer should back off (HTTP 503/429). */
export class QueueFullError extends Error {
  constructor(depth: number, max: number) {
    super(`Queue is full: backlog ${depth} exceeds MAX_QUEUE_DEPTH ${max}`);
    this.name = 'QueueFullError';
  }
}

/**
 * In-memory job queue engine. This is deliberately broker-agnostic and free of any
 * framework dependency so the *algorithm* is the star: a real deployment swaps the
 * Map for Redis/SQS/RabbitMQ, but the lease + visibility-timeout + backoff + DLQ
 * mechanics are identical.
 *
 * The two invariants that make it crash-safe:
 *  1. A worker LEASES a job (waiting → active with a lease expiry); it never deletes
 *     on read. Only after a successful `ack` is the job marked completed.
 *  2. `runMaintenance` reclaims leases whose visibility timeout lapsed (the worker
 *     crashed) and promotes delayed jobs whose time has come. This is what turns a
 *     dead worker's job back into work — the source of at-least-once delivery.
 */
export class JobQueue {
  private readonly jobs = new Map<string, Job>();
  private readonly totals = { enqueued: 0, completed: 0, retried: 0, dead: 0, reaped: 0 };

  constructor(private readonly cfg: JobQueueConfig) {}

  private now(): number {
    return Date.now();
  }

  /** Add a job. `delayMs > 0` schedules it for later; otherwise it's immediately waiting. */
  enqueue(type: string, payload: Record<string, unknown>, opts: EnqueueOptions = {}): Job {
    if (this.backlog() >= this.cfg.maxQueueDepth) {
      throw new QueueFullError(this.backlog(), this.cfg.maxQueueDepth);
    }
    const t = this.now();
    const delayMs = Math.max(0, opts.delayMs ?? 0);
    const job: Job = {
      id: randomUUID(),
      type,
      payload,
      priority: opts.priority ?? 0,
      state: delayMs > 0 ? 'delayed' : 'waiting',
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      availableAt: t + delayMs,
      leaseExpiresAt: null,
      enqueuedAt: t,
      updatedAt: t,
    };
    this.jobs.set(job.id, job);
    this.totals.enqueued++;
    return job;
  }

  /**
   * Atomically reserve the best eligible job for a worker.
   * "Best" = highest priority, ties broken by oldest enqueue time (FIFO within a priority).
   * Sets the visibility timeout; the job is now invisible to other workers until it's
   * acked, nacked, or its lease expires. Runs maintenance first so due/abandoned jobs
   * are eligible. Returns null when nothing is ready.
   */
  lease(): Job | null {
    this.runMaintenance();
    const t = this.now();

    let best: Job | null = null;
    for (const job of this.jobs.values()) {
      if (job.state !== 'waiting' || job.availableAt > t) continue;
      if (
        best === null ||
        job.priority > best.priority ||
        (job.priority === best.priority && job.enqueuedAt < best.enqueuedAt)
      ) {
        best = job;
      }
    }
    if (!best) return null;

    best.state = 'active';
    best.attempts += 1;
    best.leaseExpiresAt = t + this.cfg.visibilityTimeoutMs;
    best.updatedAt = t;
    return best;
  }

  /** Mark a leased job as successfully processed. */
  ack(jobId: string, result?: unknown): Job | null {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'active') return null;
    const t = this.now();
    job.state = 'completed';
    job.result = result;
    job.leaseExpiresAt = null;
    job.finishedAt = t;
    job.updatedAt = t;
    this.totals.completed++;
    return job;
  }

  /**
   * Report failure of a leased job. If attempts remain, re-schedule it as a delayed job
   * using exponential backoff + jitter; otherwise move it to the dead-letter queue.
   */
  nack(jobId: string, error: string): Job | null {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'active') return null;
    const t = this.now();
    job.lastError = error;
    job.leaseExpiresAt = null;
    job.updatedAt = t;

    if (job.attempts >= job.maxAttempts) {
      job.state = 'dead';
      job.finishedAt = t;
      this.totals.dead++;
    } else {
      job.state = 'delayed';
      job.availableAt = t + this.backoffMs(job.attempts);
      this.totals.retried++;
    }
    return job;
  }

  /** Exponential backoff with full jitter: min(cap, base * 2^(attempt-1)) ± jitter. */
  backoffMs(attempt: number): number {
    const exp = this.cfg.backoffBaseMs * 2 ** Math.max(0, attempt - 1);
    const capped = Math.min(this.cfg.backoffCapMs, exp);
    const jitter = Math.floor(Math.random() * this.cfg.backoffBaseMs);
    return capped + jitter;
  }

  /** Heartbeat: a long-running worker extends its lease so the reaper won't reclaim it. */
  extendLease(jobId: string, ms: number = this.cfg.visibilityTimeoutMs): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'active') return false;
    job.leaseExpiresAt = this.now() + ms;
    job.updatedAt = this.now();
    return true;
  }

  /**
   * Promote due delayed jobs to waiting, and reclaim active jobs whose lease expired
   * (the worker died or stalled). Returns how many of each happened. Idempotent and
   * cheap; call it on every lease and on a timer.
   */
  runMaintenance(): { promoted: number; reaped: number } {
    const t = this.now();
    let promoted = 0;
    let reaped = 0;
    for (const job of this.jobs.values()) {
      if (job.state === 'delayed' && job.availableAt <= t) {
        job.state = 'waiting';
        job.updatedAt = t;
        promoted++;
      } else if (job.state === 'active' && job.leaseExpiresAt !== null && job.leaseExpiresAt <= t) {
        // Lease expired → assume the worker crashed. Make it visible again for redelivery.
        job.state = 'waiting';
        job.leaseExpiresAt = null;
        job.lastError = 'lease expired (worker crash or stall) — requeued by reaper';
        job.updatedAt = t;
        reaped++;
        this.totals.reaped++;
      }
    }
    return { promoted, reaped };
  }

  /** Re-drive a dead-lettered job back onto the queue (after a human fixes the cause). */
  retryDead(jobId: string): Job | null {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'dead') return null;
    const t = this.now();
    job.state = 'waiting';
    job.attempts = 0;
    job.availableAt = t;
    job.leaseExpiresAt = null;
    job.lastError = undefined;
    job.finishedAt = undefined;
    job.updatedAt = t;
    return job;
  }

  get(jobId: string): Job | null {
    return this.jobs.get(jobId) ?? null;
  }

  /** List jobs, optionally filtered by state, newest first. */
  list(state?: JobState, limit = 200): Job[] {
    const out: Job[] = [];
    for (const job of this.jobs.values()) {
      if (!state || job.state === state) out.push(job);
    }
    out.sort((a, b) => b.updatedAt - a.updatedAt);
    return out.slice(0, limit);
  }

  /** waiting + delayed + active — the live backlog (excludes terminal states). */
  backlog(): number {
    let n = 0;
    for (const job of this.jobs.values()) {
      if (job.state === 'waiting' || job.state === 'delayed' || job.state === 'active') n++;
    }
    return n;
  }

  stats(): QueueStats {
    const counts = Object.fromEntries(ALL_STATES.map((s) => [s, 0])) as Record<JobState, number>;
    const t = this.now();
    let oldestWaitingAgeMs = 0;
    for (const job of this.jobs.values()) {
      counts[job.state]++;
      if (job.state === 'waiting') {
        oldestWaitingAgeMs = Math.max(oldestWaitingAgeMs, t - job.enqueuedAt);
      }
    }
    return {
      counts,
      totals: { ...this.totals },
      oldestWaitingAgeMs,
      backlog: counts.waiting + counts.delayed + counts.active,
    };
  }

  /** Clear everything (demo/testing convenience). */
  reset(): void {
    this.jobs.clear();
    this.totals.enqueued = 0;
    this.totals.completed = 0;
    this.totals.retried = 0;
    this.totals.dead = 0;
    this.totals.reaped = 0;
  }
}
