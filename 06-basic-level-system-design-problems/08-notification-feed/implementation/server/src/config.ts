import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3004),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/realtime-notifications'),
  UNREAD_DRIVER: z.enum(['memory', 'redis']).default('memory'),
  SOCKET_ADAPTER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(20),
  MAX_PAGE_SIZE: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

/** The room a user's sockets join; workers publish here to reach any online device. */
export const userRoom = (userId: string): string => `user:${userId}`;
