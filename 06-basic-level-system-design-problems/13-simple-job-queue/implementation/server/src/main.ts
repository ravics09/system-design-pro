import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.CORS_ORIGIN });
  // Flush in-flight jobs' acks/nacks on shutdown so leases aren't left dangling.
  app.enableShutdownHooks();
  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`Job/task queue API listening on :${config.PORT}`);
}

void bootstrap();
