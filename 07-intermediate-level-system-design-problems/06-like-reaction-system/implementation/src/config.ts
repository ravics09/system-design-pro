export const config = {
  port: Number(process.env.PORT ?? 3106),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/reactions',
  flushIntervalMs: Number(process.env.FLUSH_INTERVAL_MS ?? 5000),
};
