import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3016),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Keep serving briefly after failing readiness so the LB stops routing (race fix).
  PRESTOP_MS: z.coerce.number().int().nonnegative().default(500),
  // Max time to drain in-flight requests before forcing termination.
  DRAIN_DEADLINE_MS: z.coerce.number().int().positive().default(10_000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
