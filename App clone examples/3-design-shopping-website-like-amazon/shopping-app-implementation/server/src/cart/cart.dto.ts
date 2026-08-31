import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(300),
  priceCents: z.coerce.number().int().nonnegative(),
  image: z.string().url().nullable().optional(),
  qty: z.coerce.number().int().min(1).max(99).default(1),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const setQtySchema = z.object({ qty: z.coerce.number().int().min(0).max(99) });
export type SetQtyInput = z.infer<typeof setQtySchema>;
