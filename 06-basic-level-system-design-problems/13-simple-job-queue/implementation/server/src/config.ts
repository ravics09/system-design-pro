import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3009),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Worker pool
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
  WORKER_AUTOSTART: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(25),
  // Queue semantics
  VISIBILITY_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  BACKOFF_BASE_MS: z.coerce.number().int().positive().default(1_000),
  BACKOFF_CAP_MS: z.coerce.number().int().positive().default(30_000),
  MAX_QUEUE_DEPTH: z.coerce.number().int().positive().default(10_000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type AppConfig = typeof config;
