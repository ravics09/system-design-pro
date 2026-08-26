import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3003),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/comment-system'),
  DEFAULT_ROOT_PAGE_SIZE: z.coerce.number().int().positive().default(20),
  MAX_ROOT_PAGE_SIZE: z.coerce.number().int().positive().default(100),
  MAX_DEPTH: z.coerce.number().int().positive().default(20),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
