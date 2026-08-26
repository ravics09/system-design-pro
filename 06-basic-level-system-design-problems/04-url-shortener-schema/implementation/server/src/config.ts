import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3002),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3002'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/url-shortener'),
  CACHE_DRIVER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  CODE_START_OFFSET: z.coerce.number().int().nonnegative().default(1_000_000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
