import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { config } from '../config';
import { getProcessor } from '../queue/processors';
import type { Job } from '../queue/job.types';
import { QueueService } from '../queue/queue.service';

export interface WorkerStatus {
  paused: boolean;
  concurrency: number;
  inFlight: number;
  pollIntervalMs: number;
  processed: number;
  failed: number;
}

/**
 * A concurrent worker pool that drains the queue. On each poll tick it fills every free
 * slot by leasing a job and processing it. Processing runs the registered handler; on
 * success it acks, on throw it nacks (which the engine turns into a backoff retry or a
 * dead-letter). A heartbeat extends the lease so long jobs aren't reaped mid-flight.
 *
 * This models N worker processes; in production these are separate machines/containers
 * all leasing from the same broker.
 */
@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private paused = false;
  private concurrency = config.WORKER_CONCURRENCY;
  private inFlight = 0;
  private processed = 0;
  private failed = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly queue: QueueService) {}

  onModuleInit(): void {
    this.paused = !config.WORKER_AUTOSTART;
    this.timer = setInterval(() => this.tick(), config.POLL_INTERVAL_MS);
    if (this.timer.unref) this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    if (this.paused) return;
    while (this.inFlight < this.concurrency) {
      const job = this.queue.engine.lease();
      if (!job) break;
      this.inFlight++;
      void this.process(job).finally(() => {
        this.inFlight--;
      });
    }
  }

  private async process(job: Job): Promise<void> {
    const handler = getProcessor(job.type);
    // Heartbeat: extend the lease periodically so a long job isn't reclaimed by the reaper.
    const beat = Math.max(1000, Math.floor(config.VISIBILITY_TIMEOUT_MS / 2));
    const heartbeat = setInterval(() => this.queue.engine.extendLease(job.id), beat);
    if (heartbeat.unref) heartbeat.unref();
    try {
      const result = await handler(job);
      this.queue.engine.ack(job.id, result);
      this.processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.queue.engine.nack(job.id, message);
      this.failed++;
    } finally {
      clearInterval(heartbeat);
    }
  }

  pause(): WorkerStatus {
    this.paused = true;
    return this.status();
  }

  resume(): WorkerStatus {
    this.paused = false;
    return this.status();
  }

  setConcurrency(n: number): WorkerStatus {
    this.concurrency = Math.max(1, Math.min(1000, Math.floor(n)));
    return this.status();
  }

  status(): WorkerStatus {
    return {
      paused: this.paused,
      concurrency: this.concurrency,
      inFlight: this.inFlight,
      pollIntervalMs: config.POLL_INTERVAL_MS,
      processed: this.processed,
      failed: this.failed,
    };
  }
}
