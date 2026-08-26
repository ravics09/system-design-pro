import type { ProcessImageJob } from "../../types/index.js";

/** A received message plus the handle needed to acknowledge (delete) it. */
export interface ReceivedJob {
  job: ProcessImageJob;
  ack: () => Promise<void>;
}

/**
 * Queue abstraction for the async processing pipeline. The producer (API) and the
 * consumer (worker) both depend on this interface, not on SQS directly.
 */
export interface JobQueue {
  /** Enqueue a job for a worker to pick up. */
  publish(job: ProcessImageJob): Promise<void>;

  /**
   * Long-poll for jobs. Returns zero or more messages; each must be `ack()`-ed
   * once processed so it isn't redelivered.
   */
  receive(maxMessages: number): Promise<ReceivedJob[]>;
}
