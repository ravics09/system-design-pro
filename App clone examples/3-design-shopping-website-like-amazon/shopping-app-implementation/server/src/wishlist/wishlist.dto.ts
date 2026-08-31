import { z } from 'zod';

export const addWishlistSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(300),
  priceCents: z.coerce.number().int().nonnegative().default(0),
  image: z.string().url().nullable().optional(),
});
export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
