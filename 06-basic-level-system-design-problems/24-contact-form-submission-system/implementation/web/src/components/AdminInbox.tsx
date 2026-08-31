'use client';

import { useState } from 'react';
import { useListQuery, useResetMutation, useStatsQuery } from '../store/contactApi';
import type { SubmissionStatus } from '../types';
import { Badge, Button, Card, notifTone, statusTone } from './ui';

const FILTERS: (SubmissionStatus | 'all')[] = ['all', 'accepted', 'flagged', 'rejected'];

export function AdminInbox() {
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('all');
  const { data: submissions } = useListQuery(filter, { pollingInterval: 1500 });
  const { data: stats } = useStatsQuery(undefined, { pollingInterval: 1500 });
  const [reset] = useResetMutation();

  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12.5, borderTop: '1px solid #f1f5f9', verticalAlign: 'top' };

  return (
    <Card
      title="Admin inbox"
      right={
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {stats && (
            <>
              <Badge label="total" value={stats.total} tone="gray" />
              <Badge label="notified" value={stats.notified} tone="green" />
              <Badge label="DLQ" value={stats.deadLetters} tone={stats.deadLetters ? 'red' : 'gray'} />
            </>
          )}
          <Button variant="danger" onClick={() => reset()}>reset</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ border: '1px solid ' + (filter === f ? '#2563eb' : '#cbd5e1'), background: filter === f ? '#2563eb' : '#fff', color: filter === f ? '#fff' : '#475569', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{f}</button>
        ))}
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['from', 'message', 'status', 'spam', 'notify'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(submissions ?? []).map((s) => (
              <tr key={s.id}>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ color: '#64748b' }}>{s.email}</div>
                </td>
                <td style={{ ...td, maxWidth: 280, color: '#334155' }}>
                  {s.subject && <div style={{ fontWeight: 600 }}>{s.subject}</div>}
                  <div>{s.message.slice(0, 120)}{s.message.length > 120 ? '…' : ''}</div>
                </td>
                <td style={td}><Badge value={s.status} tone={statusTone(s.status)} /></td>
                <td style={td}>
                  <Badge value={s.spamScore} tone={s.spamScore >= 40 ? 'amber' : 'gray'} />
                  {s.spamReasons.length > 0 && <div style={{ fontSize: 11, color: '#991b1b', marginTop: 2 }}>{s.spamReasons.join(', ')}</div>}
                </td>
                <td style={td}><Badge value={s.notificationStatus} tone={notifTone(s.notificationStatus)} />{s.notificationAttempts > 1 && <span style={{ fontSize: 11, color: '#64748b' }}> ×{s.notificationAttempts}</span>}</td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr><td style={{ ...td, color: '#94a3b8' }} colSpan={5}>No submissions in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
