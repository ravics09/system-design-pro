'use client';

import { useGetStatsQuery } from '../store/queueApi';
import { ALL_STATES } from '../types';
import { Badge, Card, STATE_TONE } from './ui';

/** Live queue metrics, polled every second. */
export function StatsPanel() {
  const { data } = useGetStatsQuery(undefined, { pollingInterval: 1000 });

  return (
    <Card title="Queue stats" right={<Badge label="backlog" value={data?.backlog ?? 0} tone="blue" />}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {ALL_STATES.map((s) => (
          <Badge key={s} label={s} value={data?.counts[s] ?? 0} tone={STATE_TONE[s]} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge label="enqueued" value={data?.totals.enqueued ?? 0} tone="gray" />
        <Badge label="completed" value={data?.totals.completed ?? 0} tone="green" />
        <Badge label="retried" value={data?.totals.retried ?? 0} tone="amber" />
        <Badge label="dead" value={data?.totals.dead ?? 0} tone="red" />
        <Badge label="reaped" value={data?.totals.reaped ?? 0} tone="purple" />
        <Badge label="oldest waiting" value={`${data?.oldestWaitingAgeMs ?? 0} ms`} tone="neutral" />
      </div>
    </Card>
  );
}
