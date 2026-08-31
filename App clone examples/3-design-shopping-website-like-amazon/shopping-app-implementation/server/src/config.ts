import { z } from 'zod';

/** Validated environment config — fail fast on misconfiguration. */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3021),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/shopping'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(1).default('change-me-access-secret'),
  ACCESS_TTL_S: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_S: z.coerce.number().int().positive().default(2_592_000),

  // WooCommerce REST API (catalog source)
  WC_BASE_URL: z.string().default(''),
  WC_CONSUMER_KEY: z.string().default(''),
  WC_CONSUMER_SECRET: z.string().default(''),
  WC_CURRENCY: z.string().default('USD'),

  // Catalog cache + paging
  CATALOG_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
  DEFAULT_PER_PAGE: z.coerce.number().int().positive().max(100).default(12),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
