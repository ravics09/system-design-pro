export const config = {
  port: Number(process.env.PORT ?? 3107),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/crawler',
  crawlDelayMs: Number(process.env.CRAWL_DELAY_MS ?? 1000),
  concurrency: Number(process.env.CONCURRENCY ?? 4),
  userAgent: process.env.USER_AGENT ?? 'SystemDesignProCrawler/1.0',
};
