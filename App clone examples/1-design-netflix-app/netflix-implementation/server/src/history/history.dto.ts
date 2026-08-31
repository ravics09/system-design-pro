import { z } from 'zod';

export const progressSchema = z.object({
  imdbID: z.string().trim().min(1),
  title: z.string().trim().min(1),
  poster: z.string().url().nullable().optional(),
  positionS: z.coerce.number().min(0),
  durationS: z.coerce.number().min(0),
});
export type ProgressInput = z.infer<typeof progressSchema>;
