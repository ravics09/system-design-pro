import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { QueueFullError } from './job-queue';
import { ALL_STATES, enqueueSchema, type EnqueueInput, type JobState } from './job.types';
import { QueueService } from './queue.service';

@Controller()
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  /** Enqueue a job. Returns the created job (with its id and initial state). */
  @Post('jobs')
  enqueue(@Body(new ZodValidationPipe(enqueueSchema)) body: EnqueueInput) {
    try {
      return this.queue.enqueue(body);
    } catch (err) {
      if (err instanceof QueueFullError) {
        // Backpressure: tell the producer to slow down instead of melting the system.
        throw new ServiceUnavailableException(err.message);
      }
      throw err;
    }
  }

  /** List jobs, optionally filtered by ?state=. */
  @Get('jobs')
  list(@Query('state') state?: string) {
    if (state && !ALL_STATES.includes(state as JobState)) {
      throw new BadRequestException(`Unknown state '${state}'. Valid: ${ALL_STATES.join(', ')}`);
    }
    return this.queue.list(state as JobState | undefined);
  }

  /** Aggregate queue metrics: counts per state, cumulative totals, oldest-waiting age, backlog. */
  @Get('stats')
  stats() {
    return this.queue.stats();
  }

  /** Clear the whole queue (demo/testing convenience). */
  @Post('queue/reset')
  reset() {
    this.queue.reset();
    return { ok: true };
  }

  @Get('jobs/:id')
  get(@Param('id') id: string) {
    const job = this.queue.get(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  /** Re-drive a dead-lettered job back onto the queue. */
  @Post('jobs/:id/retry')
  retry(@Param('id') id: string) {
    const job = this.queue.retryDead(id);
    if (!job) {
      throw new BadRequestException(`Job ${id} is not in the dead-letter queue (or does not exist)`);
    }
    return job;
  }
}
