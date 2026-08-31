import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [QueueModule, WorkerModule],
})
export class AppModule {}
