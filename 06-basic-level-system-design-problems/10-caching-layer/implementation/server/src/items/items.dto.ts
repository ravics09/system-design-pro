import { z } from 'zod';

export const updateItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    value: z.coerce.number().optional(),
  })
  .refine((o) => o.name !== undefined || o.value !== undefined, {
    message: 'Provide name and/or value',
  });

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export interface ItemReadView {
  data: { id: string; name: string; value: number };
  cached: boolean; // served from cache?
  coalesced?: boolean; // joined an in-flight load?
  ms: number; // end-to-end latency (hit ≈ 0, miss ≈ origin latency)
}
