'use client';

import {
  useGetConfigQuery,
  useGetVersionsQuery,
  useRollbackMutation,
  useSetFlagMutation,
} from '../store/configApi';
import { Badge, Button, Card } from './ui';

/** Feature-flag toggles (runtime layer). */
export function FlagsPanel() {
  const { data } = useGetConfigQuery(false);
  const [setFlag] = useSetFlagMutation();
  const flags = data?.flags ?? {};
  return (
    <Card title="Feature flags">
      <div style={{ display: 'grid', gap: 8 }}>
        {Object.entries(flags).map(([name, on]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{name}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge value={on ? 'on' : 'off'} tone={on ? 'green' : 'gray'} />
              <Button variant="ghost" onClick={() => setFlag({ name, value: !on })}>{on ? 'disable' : 'enable'}</Button>
            </div>
          </div>
        ))}
        {Object.keys(flags).length === 0 && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No flags.</p>}
      </div>
    </Card>
  );
}

/** Versioned audit trail with per-version diffs and rollback. */
export function VersionHistory() {
  const { data: versions } = useGetVersionsQuery();
  const [rollback] = useRollbackMutation();
  return (
    <Card title="Version history">
      <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
        {(versions ?? []).map((v) => (
          <div key={v.version} style={{ border: '1px solid #f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Badge label="v" value={v.version} tone="blue" />
                <span style={{ fontSize: 13, color: '#334155' }}>{v.action}</span>
              </div>
              <Button variant="ghost" onClick={() => rollback(v.version)}>rollback</Button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              by {v.actor} · {new Date(v.at).toLocaleTimeString()}
            </div>
            {v.diff.length > 0 && (
              <div style={{ marginTop: 6, display: 'grid', gap: 2 }}>
                {v.diff.map((d) => (
                  <div key={d.key} style={{ fontSize: 11.5, fontFamily: 'ui-monospace, monospace', color: '#475569' }}>
                    {d.key}: <span style={{ color: '#991b1b' }}>{String(d.from)}</span> → <span style={{ color: '#166534' }}>{String(d.to)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {(!versions || versions.length === 0) && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No history.</p>}
      </div>
    </Card>
  );
}
