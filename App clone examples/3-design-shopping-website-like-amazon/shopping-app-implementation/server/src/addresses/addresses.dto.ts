import { z } from 'zod';

export const createAddressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional().default(''),
  zip: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(40).optional().default(''),
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
