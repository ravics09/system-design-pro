import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';
import { TraceMiddleware } from './common/trace.middleware';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

@Module({
  imports: [UsersModule],
  controllers: [HealthController],
  providers: [
    // Global success envelope + global error envelope — applied everywhere.
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Tracing wraps the ENTIRE pipeline so requestId is available everywhere.
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
