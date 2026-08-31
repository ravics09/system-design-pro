'use client';

import { useState } from 'react';
import { useEnqueueMutation } from '../store/queueApi';
import { Button, Card, Field, inputStyle } from './ui';

/**
 * Enqueue jobs and shape their behavior. The demo processor reads the payload
 * (`latencyMs`, `failTimes`, `alwaysFail`), so you can drive the whole lifecycle —
 * success, retry-then-succeed, and retry-until-dead — straight from this form.
 */
export function EnqueueForm() {
  const [enqueue, { isLoading }] = useEnqueueMutation();
  const [form, setForm] = useState({
    type: 'demo',
    latencyMs: 400,
    failTimes: 0,
    alwaysFail: false,
    priority: 0,
    delayMs: 0,
    maxAttempts: 3,
    count: 1,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const body = {
      type: form.type,
      payload: { latencyMs: form.latencyMs, failTimes: form.failTimes, alwaysFail: form.alwaysFail },
      priority: form.priority,
      delayMs: form.delayMs,
      maxAttempts: form.maxAttempts,
    };
    for (let i = 0; i < Math.max(1, form.count); i++) {
      await enqueue(body);
    }
  };

  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <Card title="Enqueue a job">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="type">
          <select value={form.type} onChange={(e) => set('type', e.target.value)} style={inputStyle}>
            <option value="demo">demo</option>
            <option value="email">email</option>
          </select>
        </Field>
        <Field label="how many">
          <input type="number" min={1} max={50} value={form.count} onChange={(e) => set('count', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="latencyMs (work duration)">
          <input type="number" min={0} value={form.latencyMs} onChange={(e) => set('latencyMs', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="priority (higher = sooner)">
          <input type="number" value={form.priority} onChange={(e) => set('priority', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="delayMs (schedule later)">
          <input type="number" min={0} value={form.delayMs} onChange={(e) => set('delayMs', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="maxAttempts">
          <input type="number" min={1} max={20} value={form.maxAttempts} onChange={(e) => set('maxAttempts', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="failTimes (fail N then succeed)">
          <input type="number" min={0} value={form.failTimes} onChange={(e) => set('failTimes', num(e.target.value))} style={inputStyle} />
        </Field>
        <Field label="alwaysFail (→ dead-letter)">
          <div style={{ display: 'flex', alignItems: 'center', height: 34 }}>
            <input type="checkbox" checked={form.alwaysFail} onChange={(e) => set('alwaysFail', e.target.checked)} style={{ width: 18, height: 18 }} />
          </div>
        </Field>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button type="button" onClick={submit} disabled={isLoading}>
          {isLoading ? 'Enqueuing…' : `Enqueue ${form.count > 1 ? form.count + ' jobs' : 'job'}`}
        </Button>
      </div>
    </Card>
  );
}
