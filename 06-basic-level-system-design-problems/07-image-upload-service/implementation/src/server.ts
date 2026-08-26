import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDb, disconnectDb } from "./lib/db.js";
import { reapStalePending } from "./lib/reaper.js";
import { runWorker } from "./workers/imageProcessor.js";
import { logger } from "./lib/logger.js";

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info("Image upload service listening", { port: config.PORT, env: config.NODE_ENV });
  });

  // Periodically reap orphaned PENDING uploads.
  const reaperTimer = setInterval(() => {
    reapStalePending().catch((err) =>
      logger.error("Reaper failed", { err: err instanceof Error ? err.message : String(err) }),
    );
  }, 60_000);
  reaperTimer.unref();

  // Dev convenience: with the in-memory queue there's no external worker, so run
  // the processor in-process. In production run `npm run start:worker` separately.
  if (config.QUEUE_DRIVER === "memory") {
    logger.info("QUEUE_DRIVER=memory → starting in-process worker");
    void runWorker();
  }

  // Graceful shutdown (see Problem 29).
  const shutdown = async (signal: string) => {
    logger.info("Shutting down", { signal });
    clearInterval(reaperTimer);
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
