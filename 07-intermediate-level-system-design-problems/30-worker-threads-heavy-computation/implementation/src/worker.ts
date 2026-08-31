import { parentPort } from 'node:worker_threads';
import { parseCsv, sumColumn } from './csv';

export interface Task {
  csv: string;
  sumColumnName?: string;
}

// Long-lived worker: receives tasks via postMessage so it can be reused by the pool.
parentPort?.on('message', (task: Task) => {
  try {
    const parsed = parseCsv(task.csv);
    const result = {
      rowCount: parsed.rows.length,
      headers: parsed.headers,
      sum: task.sumColumnName ? sumColumn(parsed, task.sumColumnName) : null,
    };
    parentPort!.postMessage({ ok: true, result });
  } catch (err) {
    parentPort!.postMessage({ ok: false, error: (err as Error).message });
  }
});
