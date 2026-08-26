import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Allow the Next.js dev client to call the API in local development.
  app.enableCors({ origin: config.CORS_ORIGIN });
  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`Cursor-pagination API listening on :${config.PORT}`);
}

void bootstrap();
