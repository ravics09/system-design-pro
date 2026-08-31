import { z } from 'zod';

/** A boolean that also accepts "true"/"false" strings (query params are strings). */
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

export const addressSchema = z.object({
  street: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  zip: z.string().regex(/^\d{4,10}$/, 'zip must be 4–10 digits'),
});

/**
 * Note: `z.object` STRIPS unknown keys by default — so an attacker's extra `isAdmin`/`role`
 * field is dropped before it can reach the handler (mass-assignment defense).
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80),
  email: z.string().email('invalid email'),
  age: z.coerce.number().int('age must be an integer').min(0).max(150).optional(),
  address: addressSchema.optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Query params arrive as strings → coerce them; apply pagination defaults. */
export const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  active: boolish.optional(),
});
export type SearchInput = z.infer<typeof searchSchema>;

/** Route param: a positive integer id (coerced from the string path segment). */
export const idParamSchema = z.object({
  id: z.coerce.number().int('id must be an integer').positive('id must be positive'),
});
export type IdParam = z.infer<typeof idParamSchema>;

/** Cross-field rule: endDate must be after startDate → surfaces as a top-level formError. */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate > d.startDate, { message: 'endDate must be after startDate' });
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
