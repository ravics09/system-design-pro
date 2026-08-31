import { z } from 'zod';

export const createProfileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  avatar: z.enum(['red', 'blue', 'green', 'yellow', 'purple']).default('red'),
  isKids: z.boolean().default(false),
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
