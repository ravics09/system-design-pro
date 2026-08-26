import { z } from 'zod';

/**
 * Create-URL body. The alias, if provided, is restricted to URL-safe characters
 * and a small set of reserved words is rejected so aliases can't shadow routes.
 */
const RESERVED = new Set(['api', 'health', 'admin', 'favicon.ico', 'robots.txt']);

export const createUrlSchema = z.object({
  longUrl: z.string().url().max(2048),
  alias: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, 'Alias may contain letters, numbers, _ and -')
    .refine((a) => !RESERVED.has(a.toLowerCase()), 'Alias is reserved')
    .optional(),
  // ISO date string; when present the short URL stops resolving after it.
  expiresAt: z.coerce.date().optional(),
  ownerId: z.string().max(64).optional(),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;

export interface UrlView {
  code: string;
  shortUrl: string;
  longUrl: string;
  clicks: number;
  disabled: boolean;
  expiresAt: string | null;
  createdAt: string;
}
