import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3014),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_MAX: z.coerce.number().int().positive().default(5), // submissions per window per IP
  RATE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  NOTIFY_FAILURE_RATE: z.coerce.number().min(0).max(1).default(0), // simulate mailer flakiness
  NOTIFY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
