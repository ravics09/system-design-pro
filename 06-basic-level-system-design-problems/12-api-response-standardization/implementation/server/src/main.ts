import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Expose tracing/deprecation headers to browser clients (CORS).
  app.enableCors({
    origin: config.CORS_ORIGIN,
    exposedHeaders: ['X-Request-Id', 'Deprecation', 'Sunset', 'Link'],
  });

  app.setGlobalPrefix('api');
  // URI versioning: /api/v1/..., /api/v2/... — switching to header/media-type is
  // a one-line change of `type` here.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: config.DEFAULT_VERSION });

  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`API platform listening on :${config.PORT}`);
}

void bootstrap();
