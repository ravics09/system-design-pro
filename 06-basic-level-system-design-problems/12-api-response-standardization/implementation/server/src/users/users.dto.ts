import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email().max(254),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
