import { Module } from '@nestjs/common';
import { LifecycleModule } from './lifecycle/lifecycle.module';

@Module({
  imports: [LifecycleModule],
})
export class AppModule {}
