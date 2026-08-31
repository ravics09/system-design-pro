export const config = {
  port: Number(process.env.PORT ?? 3101),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chat',
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  authSecret: process.env.AUTH_SECRET ?? 'dev-chat-secret-change-me',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
