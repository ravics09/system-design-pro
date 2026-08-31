export const config = {
  port: Number(process.env.PORT ?? 3109),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/flashsale',
  reservationTtlMs: Number(process.env.RESERVATION_TTL_MS ?? 300000),
  reapIntervalMs: Number(process.env.REAP_INTERVAL_MS ?? 2000),
};
