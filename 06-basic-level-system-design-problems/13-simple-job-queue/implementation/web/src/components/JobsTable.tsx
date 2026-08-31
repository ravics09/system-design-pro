'use client';

import { useState } from 'react';
import { useGetJobsQuery, useRetryDeadMutation } from '../store/queueApi';
import { ALL_STATES, type JobState } from '../types';
import { Badge, Button, Card, STATE_TONE } from './ui';

type Filter = JobState | 'all';
const FILTERS: Filter[] = ['all', ...ALL_STATES];

/** Live job table with a state filter and a re-drive button for dead-lettered jobs. */
export function JobsTable() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: jobs } = useGetJobsQuery(filter, { pollingInterval: 1000 });
  const [retryDead] = useRetryDeadMutation();

  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.3 };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, borderTop: '1px solid #f1f5f9', verticalAlign: 'top' };

  return (
    <Card
      title="Jobs"
      right={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: '1px solid ' + (filter === f ? '#2563eb' : '#cbd5e1'),
                background: filter === f ? '#2563eb' : '#fff',
                color: filter === f ? '#fff' : '#475569',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>id</th>
              <th style={th}>type</th>
              <th style={th}>state</th>
              <th style={th}>attempts</th>
              <th style={th}>prio</th>
              <th style={th}>detail</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {(jobs ?? []).map((j) => (
              <tr key={j.id}>
                <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{j.id.slice(0, 8)}</td>
                <td style={td}>{j.type}</td>
                <td style={td}>
                  <Badge value={j.state} tone={STATE_TONE[j.state]} />
                </td>
                <td style={td}>
                  {j.attempts}/{j.maxAttempts}
                </td>
                <td style={td}>{j.priority}</td>
                <td style={{ ...td, color: '#64748b', maxWidth: 260 }}>
                  {j.lastError ? <span style={{ color: '#991b1b' }}>{j.lastError}</span> : j.state === 'delayed' ? `runs in ~${Math.max(0, j.availableAt - Date.now())} ms` : ''}
                </td>
                <td style={td}>
                  {j.state === 'dead' && (
                    <Button variant="ghost" onClick={() => retryDead(j.id)}>
                      Re-drive
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {(!jobs || jobs.length === 0) && (
              <tr>
                <td style={{ ...td, color: '#94a3b8' }} colSpan={7}>
                  No jobs in this view. Enqueue some above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
