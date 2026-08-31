import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3015),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(1).default('dev-only-change-me'),
  ACCESS_TTL_S: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_S: z.coerce.number().int().positive().default(604_800),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
