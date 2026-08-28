import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3007),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CACHE_MAX: z.coerce.number().int().positive().default(100),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  ORIGIN_LATENCY_MS: z.coerce.number().int().nonnegative().default(120),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
