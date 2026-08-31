'use client';

import { useState } from 'react';
import {
  useGetStatusQuery,
  useResetMutation,
  useShutdownMutation,
  useWorkMutation,
} from '../store/lifecycleApi';
import { Badge, Button, Card, phaseTone } from './ui';

interface LogLine {
  at: number;
  msg: string;
  tone: 'green' | 'red' | 'amber' | 'neutral';
}

export function Dashboard() {
  const { data: status } = useGetStatusQuery(undefined, { pollingInterval: 400 });
  const [shutdown] = useShutdownMutation();
  const [reset] = useResetMutation();
  const [work] = useWorkMutation();
  const [log, setLog] = useState<LogLine[]>([]);

  const add = (msg: string, tone: LogLine['tone'] = 'neutral') =>
    setLog((l) => [{ at: Date.now(), msg, tone }, ...l].slice(0, 10));

  const launchWork = (ms: number) => {
    add(`→ GET /work?ms=${ms} started`, 'neutral');
    work(ms)
      .unwrap()
      .then((r) => {
        if (r.status === 200) add(`✓ /work (${ms}ms) completed in ${r.ms}ms`, 'green');
        else if (r.status === 503) add(`✗ /work rejected (503) — server is draining`, 'red');
        else add(`/work → ${r.status}`, 'amber');
      })
      .catch(() => add('/work request errored', 'red'));
  };

  const doShutdown = async () => {
    add('⚠️ SIGTERM (POST /shutdown) — begin draining', 'amber');
    await shutdown().unwrap();
  };

  const s = status;

  return (
    <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 1fr)' }}>
      <Card
        title="Server lifecycle"
        right={s && <Badge label="phase" value={s.phase} tone={phaseTone(s.phase)} />}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <Badge label="in-flight" value={s?.inFlight ?? 0} tone={(s?.inFlight ?? 0) > 0 ? 'blue' : 'gray'} />
          <Badge label="accepting new" value={s?.acceptingNew ? 'yes' : 'no'} tone={s?.acceptingNew ? 'green' : 'red'} />
          <Badge label="liveness" value="200 ok" tone="green" />
          <Badge label="readiness" value={s?.acceptingNew ? '200 ready' : '503 draining'} tone={s?.acceptingNew ? 'green' : 'amber'} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Badge label="preStop" value={`${s?.preStopMs ?? 0} ms`} tone="neutral" />
          <Badge label="drain deadline" value={`${s?.drainDeadlineMs ?? 0} ms`} tone="neutral" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => launchWork(3000)}>Launch slow request (3s)</Button>
          <Button variant="ghost" onClick={() => launchWork(300)}>Quick request</Button>
          <Button variant="danger" onClick={doShutdown} disabled={!s?.acceptingNew}>Trigger shutdown (SIGTERM)</Button>
          <Button variant="ghost" onClick={() => reset()}>Reset</Button>
        </div>
        <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12.5, color: '#475569' }}>
          Launch a slow request, then trigger shutdown: readiness flips to <strong>503</strong> (LB stops routing) while
          liveness stays <strong>200</strong>; new requests are <strong>rejected</strong> but the in-flight one{' '}
          <strong>finishes</strong>, then the phase reaches <strong>terminated</strong>.
        </p>
      </Card>

      <Card title="Activity log">
        <div style={{ display: 'grid', gap: 4 }}>
          {log.length === 0 && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Launch a request or trigger shutdown.</p>}
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 12.5, color: l.tone === 'red' ? '#991b1b' : l.tone === 'green' ? '#166534' : l.tone === 'amber' ? '#92400e' : '#475569' }}>
              <span style={{ color: '#94a3b8' }}>{new Date(l.at).toLocaleTimeString()} </span>
              {l.msg}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
