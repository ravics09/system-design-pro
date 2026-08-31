import { z } from 'zod';

export const concurrencySchema = z.object({
  concurrency: z.coerce.number().int().min(1).max(1000),
});

export type ConcurrencyInput = z.infer<typeof concurrencySchema>;
