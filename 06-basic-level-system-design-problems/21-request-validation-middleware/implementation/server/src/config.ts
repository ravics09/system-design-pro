import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3013),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MAX_BODY_BYTES: z.coerce.number().int().positive().default(10_240),
  MAX_DEPTH: z.coerce.number().int().positive().default(6),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
