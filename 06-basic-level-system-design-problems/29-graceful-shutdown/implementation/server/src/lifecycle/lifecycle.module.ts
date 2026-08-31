import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { InflightMiddleware } from './inflight.middleware';
import { LifecycleController } from './lifecycle.controller';
import { LifecycleService } from './lifecycle.service';

@Module({
  controllers: [HealthController, LifecycleController],
  providers: [LifecycleService, InflightMiddleware],
  exports: [LifecycleService],
})
export class LifecycleModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(InflightMiddleware).forRoutes('*');
  }
}
