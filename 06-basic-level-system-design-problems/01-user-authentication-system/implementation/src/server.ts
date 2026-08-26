import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectDb, disconnectDb } from "./lib/db.js";
import { logger } from "./lib/logger.js";

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info("Auth service listening", { port: config.PORT, env: config.NODE_ENV });
  });

  // Graceful shutdown (see Problem 29): stop accepting connections, close the DB.
  const shutdown = async (signal: string) => {
    logger.info("Shutting down", { signal });
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
