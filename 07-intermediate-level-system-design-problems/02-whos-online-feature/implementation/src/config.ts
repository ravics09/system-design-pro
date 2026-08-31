export const config = {
  port: Number(process.env.PORT ?? 3102),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  presenceTtlS: Number(process.env.PRESENCE_TTL_S ?? 30),
};
