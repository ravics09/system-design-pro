'use client';

import { useState } from 'react';
import {
  useCreateIndexMutation,
  useDropIndexMutation,
  useGetIndexesQuery,
  useGetStatsQuery,
  useResetMutation,
  useSeedMutation,
} from '../store/indexApi';
import { FIELDS, type Field } from '../types';
import { Badge, Button, Card, inputStyle } from './ui';

export function IndexManager() {
  const { data: indexes } = useGetIndexesQuery();
  const { data: stats } = useGetStatsQuery();
  const [createIndex] = useCreateIndexMutation();
  const [dropIndex] = useDropIndexMutation();
  const [seed] = useSeedMutation();
  const [reset] = useResetMutation();

  const [fields, setFields] = useState<Field[]>(['city']);
  const [kind, setKind] = useState<'btree' | 'hash'>('btree');
  const [unique, setUnique] = useState(false);
  const [size, setSize] = useState(50000);
  const [err, setErr] = useState<string | null>(null);

  const toggleField = (f: Field) => setFields((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const submit = async () => {
    setErr(null);
    const body = { fields: kind === 'hash' ? fields.slice(0, 1) : fields, kind, unique };
    const res = await createIndex(body);
    if ('error' in res) {
      const e = res.error as { data?: { message?: string } };
      setErr(e.data?.message ?? 'Failed to create index');
    }
  };

  return (
    <Card
      title="Indexes"
      right={
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge label="rows" value={stats?.rows ?? 0} tone="blue" />
          <Badge label="indexes" value={stats?.indexes ?? 0} tone="purple" />
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {(indexes ?? []).map((ix) => (
          <div key={ix.name} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', border: '1px solid #f1f5f9', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{ix.name}</span>
              <Badge value={ix.kind} tone={ix.kind === 'hash' ? 'amber' : 'blue'} />
              {ix.unique && <Badge value="unique" tone="green" />}
              <span style={{ fontSize: 12, color: '#64748b' }}>{ix.fields.join(' + ')}</span>
            </div>
            <button onClick={() => dropIndex(ix.name)} style={{ border: '1px solid #fca5a5', background: '#fff', color: '#991b1b', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer' }}>
              drop
            </button>
          </div>
        ))}
        {(!indexes || indexes.length === 0) && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No indexes — queries do a full scan.</p>}
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Create index</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FIELDS.map((f) => (
            <button key={f} onClick={() => toggleField(f)} style={{ border: '1px solid ' + (fields.includes(f) ? '#2563eb' : '#cbd5e1'), background: fields.includes(f) ? '#2563eb' : '#fff', color: fields.includes(f) ? '#fff' : '#475569', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {kind === 'btree' ? 'Compound order matters (ESR): selected left-to-right.' : 'Hash uses only the first field (equality only).'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'btree' | 'hash')} style={inputStyle}>
            <option value="btree">b-tree</option>
            <option value="hash">hash</option>
          </select>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> unique
          </label>
          <Button onClick={submit} disabled={fields.length === 0}>Create</Button>
        </div>
        {err && <div style={{ color: '#991b1b', fontSize: 12 }}>{err}</div>}
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={size} min={1} max={2000000} onChange={(e) => setSize(Number(e.target.value))} style={{ ...inputStyle, width: 120 }} />
        <Button variant="ghost" onClick={() => seed(size)}>Seed rows</Button>
        <Button variant="danger" onClick={() => reset()}>Reset</Button>
      </div>
    </Card>
  );
}
