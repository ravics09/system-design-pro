import type { NotificationStatus } from './contact.types';

/** Sends a notification for a submission; throws to signal a delivery failure. */
export type Sender = (submissionId: string, attempt: number) => Promise<void>;

interface Job {
  id: string;
  attempts: number;
  nextAt: number;
}

/**
 * Async notification queue + worker. Submissions are enqueued and delivered off the
 * request path; a failed send is retried with backoff and, after `maxAttempts`,
 * dead-lettered (notificationStatus = 'failed'). This is why email never blocks the
 * user response and a flaky mailer can't lose an accepted submission.
 */
export class Notifier {
  private queue: Job[] = [];
  private dlq: string[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly maxAttempts: number,
    private readonly sender: Sender,
    private readonly onStatus: (id: string, status: NotificationStatus, attempts: number) => void,
    private readonly backoffMs = 30,
    private readonly pollMs = 20,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.pollMs);
    if (this.timer.unref) this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  enqueue(id: string): void {
    this.queue.push({ id, attempts: 0, nextAt: Date.now() });
    this.onStatus(id, 'queued', 0);
  }

  get deadLetters(): string[] {
    return [...this.dlq];
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    const job = this.queue.find((j) => j.nextAt <= now);
    if (!job) return;
    this.queue = this.queue.filter((j) => j !== job);
    job.attempts += 1;
    try {
      await this.sender(job.id, job.attempts);
      this.onStatus(job.id, 'sent', job.attempts);
    } catch {
      if (job.attempts >= this.maxAttempts) {
        this.dlq.push(job.id);
        this.onStatus(job.id, 'failed', job.attempts);
      } else {
        job.nextAt = now + this.backoffMs * 2 ** (job.attempts - 1);
        this.queue.push(job);
        this.onStatus(job.id, 'queued', job.attempts);
      }
    }
  }

  reset(): void {
    this.queue = [];
    this.dlq = [];
  }
}

/** Default sender: "delivers" instantly, failing at a configured rate (to demo retries). */
export function randomSender(failureRate: number): Sender {
  return async () => {
    if (Math.random() < failureRate) throw new Error('simulated mailer failure');
  };
}
