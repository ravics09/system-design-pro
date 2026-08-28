import { z } from 'zod';

const userId = z.string().trim().min(1).max(64);

export const requestSchema = z.object({ from: userId, to: userId });
export const respondSchema = z.object({
  userId,
  otherId: userId,
  action: z.enum(['accept', 'decline']),
});
export const pairActionSchema = z.object({ userId, otherId: userId });

export type RequestInput = z.infer<typeof requestSchema>;
export type RespondInput = z.infer<typeof respondSchema>;
export type PairActionInput = z.infer<typeof pairActionSchema>;

/** Relationship as seen from the acting user's perspective. */
export type PerspectiveStatus =
  | 'NONE'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED'
  | 'FRIENDS'
  | 'BLOCKED' // I blocked them
  | 'BLOCKED_BY'; // they blocked me

export interface StatusView {
  userId: string;
  otherId: string;
  status: PerspectiveStatus;
}

export interface OverviewView {
  userId: string;
  friends: string[];
  incoming: string[]; // requests awaiting my response
  outgoing: string[]; // requests I sent
  blocked: string[]; // users I blocked
  blockedBy: string[]; // users who blocked me
}
