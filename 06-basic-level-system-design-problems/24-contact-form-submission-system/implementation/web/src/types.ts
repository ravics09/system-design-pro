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

export interface Stats {
  total: number;
  accepted: number;
  flagged: number;
  rejected: number;
  notified: number;
  deadLetters: number;
}

export interface ContactBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string;
}
