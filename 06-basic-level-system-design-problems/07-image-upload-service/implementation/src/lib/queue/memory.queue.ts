import type { JobQueue, ReceivedJob } from "./queue.interface.js";
import type { ProcessImageJob } from "../../types/index.js";

/**
 * In-process queue for local development and tests. NOT durable — messages live
 * only in memory. In production use the SQS implementation.
 *
 * When the worker runs in the same process as the API (dev mode) this lets the
 * whole flow work end-to-end without external infrastructure.
 */
export class InMemoryQueue implements JobQueue {
  private readonly buffer: ProcessImageJob[] = [];

  async publish(job: ProcessImageJob): Promise<void> {
    this.buffer.push(job);
  }

  async receive(maxMessages: number): Promise<ReceivedJob[]> {
    const batch = this.buffer.splice(0, Math.max(1, maxMessages));
    return batch.map((job) => ({
      job,
      ack: async () => {
        /* already removed from the buffer on receive */
      },
    }));
  }
}
