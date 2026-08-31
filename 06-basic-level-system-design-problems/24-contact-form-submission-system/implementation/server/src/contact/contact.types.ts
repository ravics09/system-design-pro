import { z } from 'zod';

export type SubmissionStatus = 'accepted' | 'flagged' | 'rejected';
export type NotificationStatus = 'skipped' | 'queued' | 'sent' | 'failed';

export interface Submission {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: SubmissionStatus;
  spamScore: number;
  spamReasons: string[];
  ip: string;
  idempotencyKey: string;
  notificationStatus: NotificationStatus;
  notificationAttempts: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * `website` is a HONEYPOT — a hidden field a real user never fills. Bots that auto-fill
 * every input will set it, so a non-empty value is a strong bot signal. It's accepted by
 * the schema (so we don't 400) and inspected by the service, which silently drops bots.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().trim().email('invalid email').max(200),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1, 'message is required').max(5000),
  website: z.string().max(200).optional(), // honeypot (accepted, checked in service)
});
export type ContactInput = z.infer<typeof contactSchema>;

/** Spam-score thresholds. */
export const SPAM_FLAG_THRESHOLD = 40;
export const SPAM_REJECT_THRESHOLD = 70;
