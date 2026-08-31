import { z } from 'zod';

export const addToListSchema = z.object({
  imdbID: z.string().trim().min(1),
  title: z.string().trim().min(1),
  poster: z.string().url().nullable().optional(),
});
export type AddToListInput = z.infer<typeof addToListSchema>;
