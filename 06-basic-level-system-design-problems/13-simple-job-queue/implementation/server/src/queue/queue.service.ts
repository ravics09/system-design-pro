import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { config } from '../config';
import { JobQueue } from './job-queue';
import type { EnqueueInput, Job, JobState, QueueStats } from './job.types';

/**
 * Nest-facing wrapper around the pure {@link JobQueue} engine. It owns the single
 * queue instance and runs a background maintenance timer so delayed jobs are promoted
 * and crashed leases are reaped even when no worker happens to be polling.
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  readonly engine = new JobQueue({
    visibilityTimeoutMs: config.VISIBILITY_TIMEOUT_MS,
    backoffBaseMs: config.BACKOFF_BASE_MS,
    backoffCapMs: config.BACKOFF_CAP_MS,
    maxQueueDepth: config.MAX_QUEUE_DEPTH,
  });

  private maintenanceTimer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    // Independent of the workers: promote due delayed jobs + reap expired leases.
    this.maintenanceTimer = setInterval(() => this.engine.runMaintenance(), config.POLL_INTERVAL_MS);
    if (this.maintenanceTimer.unref) this.maintenanceTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.maintenanceTimer) clearInterval(this.maintenanceTimer);
    this.maintenanceTimer = null;
  }

  enqueue(input: EnqueueInput): Job {
    return this.engine.enqueue(input.type, input.payload, {
      priority: input.priority,
      delayMs: input.delayMs,
      maxAttempts: input.maxAttempts,
    });
  }

  get(id: string): Job | null {
    return this.engine.get(id);
  }

  list(state?: JobState): Job[] {
    return this.engine.list(state);
  }

  stats(): QueueStats {
    return this.engine.stats();
  }

  retryDead(id: string): Job | null {
    return this.engine.retryDead(id);
  }

  reset(): void {
    this.engine.reset();
  }
}
