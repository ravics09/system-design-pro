import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3010),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SEED_SIZE: z.coerce.number().int().positive().max(2_000_000).default(50_000),
  MAX_RESULT: z.coerce.number().int().positive().default(1_000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
