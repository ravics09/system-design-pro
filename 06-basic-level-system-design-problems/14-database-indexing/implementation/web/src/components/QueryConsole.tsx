'use client';

import { useState } from 'react';
import { useRunQueryMutation } from '../store/indexApi';
import { FIELDS, type Field, type Op, type Predicate, type QueryResult } from '../types';
import { Badge, Button, Card, inputStyle } from './ui';

const OPS: Op[] = ['eq', 'gt', 'gte', 'lt', 'lte'];

export function QueryConsole() {
  const [runQuery, { isLoading }] = useRunQueryMutation();
  const [where, setWhere] = useState<Predicate[]>([{ field: 'city', op: 'eq', value: 'London' }]);
  const [sortField, setSortField] = useState<Field | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [result, setResult] = useState<QueryResult | null>(null);

  const setPred = (i: number, patch: Partial<Predicate>) =>
    setWhere((w) => w.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addPred = () => setWhere((w) => [...w, { field: 'status', op: 'eq', value: 'active' }]);
  const removePred = (i: number) => setWhere((w) => w.filter((_, idx) => idx !== i));

  const run = async () => {
    const query = {
      where: where.map((p) => ({ ...p, value: p.field === 'age' || p.field === 'id' || p.field === 'createdAt' ? Number(p.value) : p.value })),
      ...(sortField ? { sort: { field: sortField, dir: sortDir } } : {}),
      limit: 25,
    };
    const res = await runQuery(query);
    if ('data' in res && res.data) setResult(res.data);
  };

  const ex = result?.explain;

  return (
    <Card title="Query console">
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {where.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select value={p.field} onChange={(e) => setPred(i, { field: e.target.value as Field })} style={inputStyle}>
              {FIELDS.map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
            <select value={p.op} onChange={(e) => setPred(i, { op: e.target.value as Op })} style={inputStyle}>
              {OPS.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
            <input value={String(p.value)} onChange={(e) => setPred(i, { value: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => removePred(i)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={addPred}>+ predicate</Button>
          <span style={{ fontSize: 12, color: '#64748b' }}>sort</span>
          <select value={sortField} onChange={(e) => setSortField(e.target.value as Field | '')} style={inputStyle}>
            <option value="">(none)</option>
            {FIELDS.map((f) => (<option key={f} value={f}>{f}</option>))}
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')} style={inputStyle}>
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
          <Button onClick={run} disabled={isLoading}>{isLoading ? 'Running…' : 'Run query'}</Button>
        </div>
      </div>

      {ex && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge label="plan" value={ex.strategy} tone={ex.strategy === 'IXSCAN' ? 'green' : 'red'} />
            {ex.indexUsed && <Badge label="index" value={ex.indexUsed} tone="blue" mono />}
            {ex.kind && <Badge label="kind" value={ex.kind} tone="purple" />}
            <Badge label="examined" value={ex.rowsExamined} tone={ex.rowsExamined <= ex.rowsReturned * 2 + 1 ? 'green' : 'amber'} />
            <Badge label="returned" value={ex.rowsReturned} tone="neutral" />
            <Badge label="sort stage" value={ex.sorted ? 'yes' : 'no'} tone={ex.sorted ? 'amber' : 'green'} />
            <Badge label="covered" value={ex.covered ? 'yes' : 'no'} tone={ex.covered ? 'green' : 'gray'} />
            <Badge label="took" value={`${ex.tookMs} ms`} tone="neutral" />
          </div>
          <div style={{ fontSize: 12, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
            <strong>examined:returned</strong> = {ex.rowsExamined}:{ex.rowsReturned} — {ex.planReason}
          </div>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <tbody>
                {result!.rows.slice(0, 25).map((r, i) => (
                  <tr key={i} style={{ borderTop: i ? '1px solid #f1f5f9' : undefined }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'ui-monospace, monospace' }}>{JSON.stringify(r)}</td>
                  </tr>
                ))}
                {result!.rows.length === 0 && <tr><td style={{ padding: '6px 10px', color: '#94a3b8' }}>No matching rows.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
