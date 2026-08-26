import { config } from "../../config/index.js";
import type { JobQueue } from "./queue.interface.js";
import { SqsQueue } from "./sqs.queue.js";
import { InMemoryQueue } from "./memory.queue.js";

let instance: JobQueue | null = null;

/**
 * Singleton queue. With QUEUE_DRIVER=memory the same instance is shared across
 * the process, so an in-process worker can consume what the API produced.
 */
export function getQueue(): JobQueue {
  if (!instance) {
    instance = config.QUEUE_DRIVER === "sqs" ? new SqsQueue() : new InMemoryQueue();
  }
  return instance;
}

export type { JobQueue, ReceivedJob } from "./queue.interface.js";
