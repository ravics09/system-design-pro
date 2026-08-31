import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LifecycleService } from './lifecycle/lifecycle.service';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: config.CORS_ORIGIN });
  await app.listen(config.PORT);

  // Real graceful shutdown: on SIGTERM/SIGINT, drain in-flight requests, then exit.
  const lc = app.get(LifecycleService);
  const onSignal = (signal: string) => async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received — draining…`);
    const result = await lc.manager.beginShutdown(async () => {
      await app.close(); // stop accepting connections + close Nest resources
    });
    // eslint-disable-next-line no-console
    console.log(`drained in ${result.drainedMs}ms (forced=${result.forced}) — exiting`);
    process.exit(0);
  };
  process.on('SIGTERM', onSignal('SIGTERM'));
  process.on('SIGINT', onSignal('SIGINT'));

  // eslint-disable-next-line no-console
  console.log(`Graceful-shutdown API listening on :${config.PORT}`);
}

void bootstrap();
