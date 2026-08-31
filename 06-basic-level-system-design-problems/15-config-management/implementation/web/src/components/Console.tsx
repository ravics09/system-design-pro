'use client';

import { useState } from 'react';
import {
  useGetConfigQuery,
  useGetLayersQuery,
  useResetMutation,
  useSetEnvironmentMutation,
} from '../store/configApi';
import type { Env } from '../types';
import { Badge, Button, Card, inputStyle, sourceTone } from './ui';
import { ConfigTable } from './ConfigTable';

const ENVS: Env[] = ['local', 'dev', 'prod'];

export function Console() {
  const [reveal, setReveal] = useState(false);
  const { data: resolved } = useGetConfigQuery(reveal);
  const { data: layers } = useGetLayersQuery(reveal);
  const [setEnvironment] = useSetEnvironmentMutation();
  const [reset] = useResetMutation();

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card
        title="Resolved config"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>environment</span>
            <select value={resolved?.environment ?? 'dev'} onChange={(e) => setEnvironment(e.target.value as Env)} style={inputStyle}>
              {ENVS.map((e) => (<option key={e} value={e}>{e}</option>))}
            </select>
            <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> reveal secrets
            </label>
            <Badge label="v" value={resolved?.version ?? 0} tone="blue" />
            <Button variant="danger" onClick={() => reset()}>reset</Button>
          </div>
        }
      >
        <ConfigTable resolved={resolved} />
      </Card>

      <Card title="Layer breakdown">
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}>
          Precedence low → high. A key&apos;s effective value comes from the <strong>highest</strong> layer that sets it.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {(layers ?? []).map((layer) => (
            <div key={layer.name} style={{ border: '1px solid #f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ marginBottom: 6 }}>
                <Badge value={layer.name} tone={sourceTone(layer.name)} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(layer.values).length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>(no keys)</span>}
                {Object.entries(layer.values).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 11.5, fontFamily: 'ui-monospace, monospace', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 6px' }}>
                    {k}={String(v)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
