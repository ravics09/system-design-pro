import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { nextRun, type Schedule } from './cron';

const DUE = 'jobs:due'; // ZSET: member=jobId, score=nextRunAt(ms)

/**
 * Atomically claim ONE due job: read the earliest due member and ZREM it in a single Lua
 * script. Across many dispatcher instances, only the one whose ZREM removes the member
 * "wins" — giving exactly-once dispatch without extra coordination.
 */
const CLAIM_LUA = `
local due = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 1)
if #due == 0 then return false end
if redis.call('ZREM', KEYS[1], due[1]) == 1 then return due[1] end
return false
`;

export interface Job {
  id: string;
  name: string;
  schedule: Schedule;
  runs: number;
  lastRunAt: number | null;
}

export class Scheduler {
  constructor(private readonly redis: Redis) {}

  async schedule(name: string, schedule: Schedule, now = Date.now()): Promise<Job | null> {
    const next = nextRun(schedule, now);
    if (next == null) return null; // one-off already in the past
    const job: Job = { id: randomUUID(), name, schedule, runs: 0, lastRunAt: null };
    await this.redis.hset(`job:${job.id}`, 'data', JSON.stringify(job));
    await this.redis.zadd(DUE, next, job.id);
    return job;
  }

  async claimDue(now = Date.now()): Promise<string[]> {
    const claimed: string[] = [];
    // Drain all currently-due jobs this tick.
    for (;;) {
      const jobId = (await this.redis.eval(CLAIM_LUA, 1, DUE, String(now))) as string | null;
      if (!jobId) break;
      claimed.push(jobId);
    }
    return claimed;
  }

  /** "Execute" a job (here: record the run) and reschedule if recurring. */
  async runJob(jobId: string, now = Date.now()): Promise<void> {
    const raw = await this.redis.hget(`job:${jobId}`, 'data');
    if (!raw) return;
    const job = JSON.parse(raw) as Job;
    job.runs += 1;
    job.lastRunAt = now;
    await this.redis.hset(`job:${jobId}`, 'data', JSON.stringify(job));
    await this.redis.rpush(`runs:${jobId}`, String(now));
    const next = nextRun(job.schedule, now);
    if (next != null && job.schedule.type !== 'once') {
      await this.redis.zadd(DUE, next, jobId); // recurring → re-arm
    }
  }

  async getJob(jobId: string): Promise<Job | null> {
    const raw = await this.redis.hget(`job:${jobId}`, 'data');
    return raw ? (JSON.parse(raw) as Job) : null;
  }

  async runs(jobId: string): Promise<number[]> {
    return (await this.redis.lrange(`runs:${jobId}`, 0, -1)).map(Number);
  }
}
