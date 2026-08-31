'use client';

import {
  useGetWorkersQuery,
  usePauseWorkersMutation,
  useResetMutation,
  useResumeWorkersMutation,
  useSetConcurrencyMutation,
} from '../store/queueApi';
import { Badge, Button, Card } from './ui';

/** Pause/resume the worker pool, scale concurrency, and reset the queue. */
export function WorkerControls() {
  const { data } = useGetWorkersQuery(undefined, { pollingInterval: 1000 });
  const [pause] = usePauseWorkersMutation();
  const [resume] = useResumeWorkersMutation();
  const [setConcurrency] = useSetConcurrencyMutation();
  const [reset] = useResetMutation();

  const concurrency = data?.concurrency ?? 1;

  return (
    <Card
      title="Worker pool"
      right={<Badge label="status" value={data?.paused ? 'paused' : 'running'} tone={data?.paused ? 'amber' : 'green'} />}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Badge label="concurrency" value={concurrency} tone="blue" />
        <Badge label="in-flight" value={data?.inFlight ?? 0} tone="amber" />
        <Badge label="processed" value={data?.processed ?? 0} tone="green" />
        <Badge label="failed" value={data?.failed ?? 0} tone="red" />
        <Badge label="poll" value={`${data?.pollIntervalMs ?? 0} ms`} tone="gray" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {data?.paused ? (
          <Button onClick={() => resume()}>Resume</Button>
        ) : (
          <Button variant="ghost" onClick={() => pause()}>
            Pause
          </Button>
        )}
        <Button variant="ghost" onClick={() => setConcurrency(Math.max(1, concurrency - 1))}>
          − concurrency
        </Button>
        <Button variant="ghost" onClick={() => setConcurrency(concurrency + 1)}>
          + concurrency
        </Button>
        <Button variant="danger" onClick={() => reset()}>
          Reset queue
        </Button>
      </div>
    </Card>
  );
}
