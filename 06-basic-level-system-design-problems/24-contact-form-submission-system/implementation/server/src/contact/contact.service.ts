import { randomUUID } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { config } from '../config';
import { SlidingWindowLimiter } from './rate-limiter';
import { spamScore } from './spam';
import { Notifier, randomSender } from './notifier';
import {
  SPAM_FLAG_THRESHOLD,
  SPAM_REJECT_THRESHOLD,
  type ContactInput,
  type Submission,
  type SubmissionStatus,
} from './contact.types';

@Injectable()
export class ContactService implements OnModuleInit, OnModuleDestroy {
  private submissions = new Map<string, Submission>();
  private byIdempotency = new Map<string, string>(); // key → submissionId
  private readonly limiter = new SlidingWindowLimiter(config.RATE_MAX, config.RATE_WINDOW_MS);
  readonly notifier = new Notifier(
    config.NOTIFY_MAX_ATTEMPTS,
    randomSender(config.NOTIFY_FAILURE_RATE),
    (id, status, attempts) => this.setNotification(id, status, attempts),
  );

  onModuleInit(): void {
    this.notifier.start();
  }
  onModuleDestroy(): void {
    this.notifier.stop();
  }

  private setNotification(id: string, status: Submission['notificationStatus'], attempts: number): void {
    const s = this.submissions.get(id);
    if (!s) return;
    s.notificationStatus = status;
    s.notificationAttempts = attempts;
    s.updatedAt = Date.now();
  }

  /**
   * The submit pipeline: idempotency → honeypot → rate limit → spam score → persist →
   * (if accepted) enqueue async notification. Responds fast; email happens in the worker.
   */
  submit(input: ContactInput, ip: string, idempotencyKey: string): Submission {
    // Idempotency: a repeated key returns the same record (no dupes, one notification).
    const existingId = this.byIdempotency.get(idempotencyKey);
    if (existingId) return this.submissions.get(existingId)!;

    const now = Date.now();
    const base: Submission = {
      id: `sub_${randomUUID().slice(0, 8)}`,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: 'accepted',
      spamScore: 0,
      spamReasons: [],
      ip,
      idempotencyKey,
      notificationStatus: 'skipped',
      notificationAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Honeypot: a filled hidden field means a bot → silently drop (persist as rejected).
    if (input.website && input.website.trim().length > 0) {
      base.status = 'rejected';
      base.spamReasons = ['honeypot filled (bot)'];
      base.spamScore = 100;
      this.persist(base);
      return base;
    }

    // Rate limit per IP (sliding window).
    if (!this.limiter.allow(ip)) {
      throw new HttpException(
        { error: 'RATE_LIMITED', message: 'Too many submissions, please try again later' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Spam score → status.
    const { score, reasons } = spamScore(input);
    base.spamScore = score;
    base.spamReasons = reasons;
    const status: SubmissionStatus =
      score >= SPAM_REJECT_THRESHOLD ? 'rejected' : score >= SPAM_FLAG_THRESHOLD ? 'flagged' : 'accepted';
    base.status = status;

    this.persist(base); // source of truth — persisted before we notify

    if (status === 'accepted') {
      base.notificationStatus = 'queued';
      this.notifier.enqueue(base.id); // async — never blocks the response
    }
    return base;
  }

  private persist(s: Submission): void {
    this.submissions.set(s.id, s);
    this.byIdempotency.set(s.idempotencyKey, s.id);
  }

  get(id: string): Submission | null {
    return this.submissions.get(id) ?? null;
  }

  list(filter?: { status?: SubmissionStatus; spam?: boolean }): Submission[] {
    let out = [...this.submissions.values()];
    if (filter?.status) out = out.filter((s) => s.status === filter.status);
    if (filter?.spam) out = out.filter((s) => s.spamScore >= SPAM_FLAG_THRESHOLD);
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }

  stats() {
    const all = [...this.submissions.values()];
    const by = (st: SubmissionStatus) => all.filter((s) => s.status === st).length;
    return {
      total: all.length,
      accepted: by('accepted'),
      flagged: by('flagged'),
      rejected: by('rejected'),
      notified: all.filter((s) => s.notificationStatus === 'sent').length,
      deadLetters: this.notifier.deadLetters.length,
    };
  }

  reset(): void {
    this.submissions.clear();
    this.byIdempotency.clear();
    this.limiter.reset();
    this.notifier.reset();
  }
}
