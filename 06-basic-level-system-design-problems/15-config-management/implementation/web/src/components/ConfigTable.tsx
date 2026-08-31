'use client';

import { useState } from 'react';
import { useClearOverrideMutation, useGetMetaQuery, useSetOverrideMutation } from '../store/configApi';
import type { ConfigValue, Resolved } from '../types';
import { Badge, Button, inputStyle, sourceTone } from './ui';

/** The resolved config, one row per key, with a source badge and an inline editor. */
export function ConfigTable({ resolved }: { resolved?: Resolved }) {
  const { data: meta } = useGetMetaQuery();
  const [setOverride] = useSetOverrideMutation();
  const [clearOverride] = useClearOverrideMutation();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});

  if (!resolved || !meta) return <p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p>;

  const apply = async (key: string, type: string) => {
    const raw = draft[key];
    if (raw === undefined) return;
    let value: ConfigValue = raw;
    if (type === 'number') value = Number(raw);
    else if (type === 'boolean') value = raw === 'true';
    const res = await setOverride({ key, value });
    if ('error' in res) {
      const e = res.error as { data?: { errors?: Record<string, string[]> } };
      setErr((s) => ({ ...s, [key]: e.data?.errors?.[key]?.join(', ') ?? 'invalid' }));
    } else {
      setErr((s) => ({ ...s, [key]: '' }));
      setDraft((d) => ({ ...d, [key]: '' }));
    }
  };

  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, borderTop: '1px solid #f1f5f9', verticalAlign: 'middle' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {meta.map((m) => {
            const val = resolved.config[m.key];
            const src = resolved.source[m.key] ?? 'defaults';
            return (
              <tr key={m.key}>
                <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
                  {m.key}
                  {m.secret && <Badge value="secret" tone="red" />}
                </td>
                <td style={{ ...td, fontFamily: 'ui-monospace, monospace', color: '#0f172a' }}>{String(val)}</td>
                <td style={td}><Badge label="from" value={src} tone={sourceTone(src)} /></td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {m.type === 'enum' ? (
                      <select value={draft[m.key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value }))} style={inputStyle}>
                        <option value="">override…</option>
                        {m.enumValues!.map((v) => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    ) : m.type === 'boolean' ? (
                      <select value={draft[m.key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value }))} style={inputStyle}>
                        <option value="">override…</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input placeholder="override…" value={draft[m.key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value }))} style={{ ...inputStyle, width: 130 }} />
                    )}
                    <Button variant="ghost" onClick={() => apply(m.key, m.type)} disabled={!draft[m.key]}>set</Button>
                    {src === 'runtime' && <Button variant="danger" onClick={() => clearOverride(m.key)}>clear</Button>}
                  </div>
                  {err[m.key] && <div style={{ color: '#991b1b', fontSize: 11, marginTop: 2 }}>{err[m.key]}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
