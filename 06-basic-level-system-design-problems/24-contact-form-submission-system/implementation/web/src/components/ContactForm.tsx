'use client';

import { useState } from 'react';
import { useSubmitMutation } from '../store/contactApi';
import type { Submission } from '../types';
import { Badge, Button, Card, inputStyle, statusTone } from './ui';

const newKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

export function ContactForm() {
  const [submit, { isLoading }] = useSubmitMutation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [idempotencyKey, setIdempotencyKey] = useState(newKey());
  const [outcome, setOutcome] = useState<{ status: number; submission?: Submission; error?: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const send = async () => {
    const res = await submit({ body: form, idempotencyKey });
    if ('data' in res && res.data) {
      const { status, body } = res.data;
      if (status === 201) {
        setOutcome({ status, submission: body as Submission });
        if ((body as Submission).status === 'accepted') {
          // fresh key for the next distinct message
          setIdempotencyKey(newKey());
          setForm({ name: '', email: '', subject: '', message: '', website: '' });
        }
      } else if (status === 429) {
        setOutcome({ status, error: 'Rate limited — too many submissions. Try again later.' });
      } else {
        const b = body as { fieldErrors?: Record<string, string[]> };
        setOutcome({ status, error: b.fieldErrors ? Object.entries(b.fieldErrors).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' · ') : 'Submission failed' });
      }
    }
  };

  return (
    <Card title="Contact us">
      <div style={{ display: 'grid', gap: 10 }}>
        <input placeholder="Your name" value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
        <input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
        <input placeholder="Subject (optional)" value={form.subject} onChange={(e) => set('subject', e.target.value)} style={inputStyle} />
        <textarea placeholder="Message" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />

        {/* Honeypot: hidden from real users; bots that autofill it get silently dropped. */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label>
            Leave this empty
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={send} disabled={isLoading}>{isLoading ? 'Sending…' : 'Send message'}</Button>
          <label style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={!!form.website} onChange={(e) => set('website', e.target.checked ? 'http://bot.example' : '')} />
            simulate bot (fill honeypot)
          </label>
        </div>

        {outcome && (
          <div style={{ marginTop: 4, fontSize: 13 }}>
            {outcome.submission ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge label="status" value={outcome.submission.status} tone={statusTone(outcome.submission.status)} />
                <Badge label="spam" value={outcome.submission.spamScore} tone={outcome.submission.spamScore >= 40 ? 'amber' : 'gray'} />
                {outcome.submission.status === 'accepted' ? <span style={{ color: '#166534' }}>Thanks! We&apos;ll be in touch.</span> : <span style={{ color: '#991b1b' }}>{outcome.submission.spamReasons.join(', ') || 'not delivered'}</span>}
              </div>
            ) : (
              <span style={{ color: '#991b1b' }}>{outcome.error}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
