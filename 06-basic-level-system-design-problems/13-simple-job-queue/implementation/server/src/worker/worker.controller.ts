import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { concurrencySchema, type ConcurrencyInput } from './worker.dto';
import { WorkerService } from './worker.service';

@Controller('workers')
export class WorkerController {
  constructor(private readonly workers: WorkerService) {}

  @Get()
  status() {
    return this.workers.status();
  }

  @Post('pause')
  pause() {
    return this.workers.pause();
  }

  @Post('resume')
  resume() {
    return this.workers.resume();
  }

  /** Scale the pool up/down at runtime. */
  @Post('concurrency')
  setConcurrency(@Body(new ZodValidationPipe(concurrencySchema)) body: ConcurrencyInput) {
    return this.workers.setConcurrency(body.concurrency);
  }
}
