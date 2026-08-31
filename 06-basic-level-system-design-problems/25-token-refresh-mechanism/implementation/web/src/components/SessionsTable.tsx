'use client';

import { useResetMutation, useSessionsQuery } from '../store/authApi';
import { Badge, Button, Card } from './ui';

/** Live view of the refresh-token lineage: rotation marks tokens used; reuse revokes the family. */
export function SessionsTable() {
  const { data: sessions } = useSessionsQuery(undefined, { pollingInterval: 1500 });
  const [reset] = useResetMutation();
  const td: React.CSSProperties = { padding: '7px 10px', fontSize: 12.5, borderTop: '1px solid #f1f5f9', fontFamily: 'ui-monospace, monospace' };

  return (
    <Card title="Refresh-token families" right={<Button variant="danger" onClick={() => reset()}>reset</Button>}>
      <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#475569' }}>
        Each login starts a <strong>family</strong>; each refresh issues a child (parent → child). A token turns{' '}
        <strong>used</strong> on rotation; replaying a used token <strong>revokes the whole family</strong>.
      </p>
      <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['token', 'family', 'parent', 'used', 'revoked'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, textTransform: 'uppercase', color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sessions ?? []).map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.id}</td>
                <td style={td}>{s.familyId}</td>
                <td style={td}>{s.parentId ?? '—'}</td>
                <td style={td}><Badge value={s.used ? 'used' : 'active'} tone={s.used ? 'amber' : 'green'} /></td>
                <td style={td}><Badge value={s.revoked ? 'revoked' : 'valid'} tone={s.revoked ? 'red' : 'gray'} /></td>
              </tr>
            ))}
            {(!sessions || sessions.length === 0) && (
              <tr><td style={{ ...td, color: '#94a3b8' }} colSpan={5}>No sessions — log in to start a family.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
