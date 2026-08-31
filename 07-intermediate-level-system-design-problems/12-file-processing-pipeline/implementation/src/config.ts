export const config = {
  port: Number(process.env.PORT ?? 3112),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/pipeline',
  workers: Number(process.env.WORKERS ?? 2),
  leaseMs: Number(process.env.LEASE_MS ?? 30000),
};
