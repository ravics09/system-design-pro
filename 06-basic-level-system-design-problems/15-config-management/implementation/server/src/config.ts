import { z } from 'zod';

/** Runtime env for the *service itself* (distinct from the config it manages). */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3011),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  APP_ENV: z.enum(['local', 'dev', 'prod']).default('dev'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
