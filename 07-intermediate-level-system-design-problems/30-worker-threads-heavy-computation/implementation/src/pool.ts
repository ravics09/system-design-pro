import path from 'node:path';
import { Worker } from 'node:worker_threads';
import type { Task } from './worker';

interface Pending {
  task: Task;
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
}

/**
 * A fixed-size worker_threads pool. Workers are long-lived and reused (avoids per-task startup
 * cost); tasks beyond the pool size queue and apply backpressure. Keeps CPU-bound work off the
 * main event loop so the HTTP server stays responsive.
 */
export class WorkerPool {
  private idle: Worker[] = [];
  private busy = new Map<Worker, Pending>();
  private queue: Pending[] = [];

  constructor(size: number) {
    // In dev we run .ts via tsx; in the built image we run .js. Pick the matching worker file.
    const isTs = __filename.endsWith('.ts');
    const workerFile = path.join(__dirname, isTs ? 'worker.ts' : 'worker.js');
    const execArgv = isTs ? ['--import', 'tsx'] : [];
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerFile, { execArgv });
      worker.on('message', (msg) => this.onDone(worker, msg));
      worker.on('error', (err) => this.onError(worker, err));
      this.idle.push(worker);
    }
  }

  run(task: Task): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const pending: Pending = { task, resolve, reject };
      const worker = this.idle.pop();
      if (worker) this.assign(worker, pending);
      else this.queue.push(pending); // backpressure: wait for a free worker
    });
  }

  private assign(worker: Worker, pending: Pending): void {
    this.busy.set(worker, pending);
    worker.postMessage(pending.task);
  }

  private onDone(worker: Worker, msg: unknown): void {
    const pending = this.busy.get(worker);
    this.busy.delete(worker);
    pending?.resolve(msg);
    const next = this.queue.shift();
    if (next) this.assign(worker, next);
    else this.idle.push(worker);
  }

  private onError(worker: Worker, err: Error): void {
    const pending = this.busy.get(worker);
    this.busy.delete(worker);
    pending?.reject(err);
  }

  async destroy(): Promise<void> {
    await Promise.all([...this.idle, ...this.busy.keys()].map((w) => w.terminate()));
  }
}
