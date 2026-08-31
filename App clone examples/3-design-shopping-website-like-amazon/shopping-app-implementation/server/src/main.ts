import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.CORS_ORIGIN, credentials: true });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`Shopping API listening on :${config.PORT} (prefix /api)`);
}

void bootstrap();
