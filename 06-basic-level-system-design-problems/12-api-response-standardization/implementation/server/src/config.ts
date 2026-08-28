import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3008),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DEFAULT_VERSION: z.string().default('2'),
  V1_SUNSET: z.string().default('Wed, 31 Dec 2026 23:59:59 GMT'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
