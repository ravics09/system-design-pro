import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.CORS_ORIGIN });

  // Multi-instance WebSocket fan-out via the Redis adapter (opt-in).
  if (config.SOCKET_ADAPTER === 'redis') {
    const adapter = new RedisIoAdapter(app);
    await adapter.connectToRedis();
    app.useWebSocketAdapter(adapter);
    // eslint-disable-next-line no-console
    console.log('WebSocket Redis adapter enabled (multi-instance fan-out)');
  }

  await app.listen(config.PORT);
  // eslint-disable-next-line no-console
  console.log(`Real-time notifications API listening on :${config.PORT}`);
}

void bootstrap();
