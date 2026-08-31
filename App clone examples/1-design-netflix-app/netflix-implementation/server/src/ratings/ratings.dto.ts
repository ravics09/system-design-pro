import { z } from 'zod';

export const rateSchema = z.object({
  imdbID: z.string().trim().min(1),
  value: z.enum(['up', 'down']),
});
export type RateInput = z.infer<typeof rateSchema>;
