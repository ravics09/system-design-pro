import type { Redis } from 'ioredis';
import { Job } from './models';
import { planRenditions } from './pipeline';

export const QUEUE = 'jobs:queue';

/**
 * Consumer worker. `BRPOP` atomically claims one job id (only one worker gets it). Processing
 * is idempotent: we guard on the current status, write renditions to deterministic keys, and
 * mark ready. A crash mid-job leaves a `processing` doc whose lease expires → requeued.
 */
export async function runWorker(redis: Redis, leaseMs: number, signal: { stop: boolean }): Promise<void> {
  const brpop = redis.duplicate(); // blocking client must be separate
  while (!signal.stop) {
    const popped = await brpop.brpop(QUEUE, 2);
    if (!popped) continue;
    const jobId = popped[1];
    try {
      await processJob(jobId, leaseMs);
    } catch (err) {
      await Job.updateOne({ _id: jobId }, { $set: { status: 'failed', error: (err as Error).message, updatedAt: new Date() } });
    }
  }
  brpop.disconnect();
}

async function processJob(jobId: string, leaseMs: number): Promise<void> {
  // Claim: only transition queued/expired-processing → processing (idempotent guard).
  const claimed = await Job.findOneAndUpdate(
    { _id: jobId, status: { $in: ['queued', 'failed'] } },
    { $set: { status: 'processing', leaseUntil: new Date(Date.now() + leaseMs), updatedAt: new Date() }, $inc: { attempts: 1 } },
    { new: true },
  ).lean();
  if (!claimed) return; // already processed by someone else, or ready

  const renditions = planRenditions(claimed.sourceHeight ?? 1080);
  await new Promise((r) => setTimeout(r, 50)); // simulate CPU-heavy transcode

  await Job.updateOne(
    { _id: jobId, status: 'processing' },
    { $set: { status: 'ready', renditions, leaseUntil: null, updatedAt: new Date() } },
  );
}

/** Requeue jobs whose processing lease expired (worker likely crashed). */
export async function requeueStale(redis: Redis): Promise<number> {
  const stale = await Job.find({ status: 'processing', leaseUntil: { $lt: new Date() } }, { _id: 1 }).lean();
  for (const j of stale) {
    await Job.updateOne({ _id: j._id, status: 'processing' }, { $set: { status: 'queued', updatedAt: new Date() } });
    await redis.lpush(QUEUE, String(j._id));
  }
  return stale.length;
}
