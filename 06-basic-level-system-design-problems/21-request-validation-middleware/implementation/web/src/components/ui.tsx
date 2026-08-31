'use client';

import type { CSSProperties, ReactNode } from 'react';

type Tone = 'neutral' | 'green' | 'red' | 'amber' | 'blue' | 'gray';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#eef1f5', fg: '#334155' },
  green: { bg: '#dcfce7', fg: '#166534' },
  red: { bg: '#fee2e2', fg: '#991b1b' },
  amber: { bg: '#fef3c7', fg: '#92400e' },
  blue: { bg: '#dbeafe', fg: '#1e40af' },
  gray: { bg: '#f1f5f9', fg: '#64748b' },
};

export function Badge({ label, value, tone = 'neutral' }: { label?: string; value: ReactNode; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline', background: t.bg, color: t.fg, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
      {label && <span style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>}
      <span>{value}</span>
    </span>
  );
}

export function Button({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: '#2563eb', color: '#fff', border: '1px solid #2563eb', padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 }}>
      {children}
    </button>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>{title}</h2>
      {children}
    </section>
  );
}

export const inputStyle: CSSProperties = {
  padding: '7px 9px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'ui-monospace, monospace',
};

/** Renders a CallResult: status badge + fieldErrors/formErrors + raw JSON. */
export function ResultView({ result }: { result: { status: number; ok: boolean; body: unknown } | null }) {
  if (!result) return <p style={{ color: '#64748b', fontSize: 13 }}>Submit to see the result.</p>;
  const body = result.body as { error?: string; fieldErrors?: Record<string, string[]>; formErrors?: string[] };
  const isValidationError = body?.error === 'VALIDATION_ERROR';
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge label="http" value={result.status} tone={result.ok ? 'green' : 'red'} />
        <Badge label="result" value={result.ok ? 'valid' : isValidationError ? 'invalid' : 'rejected'} tone={result.ok ? 'green' : 'red'} />
      </div>
      {isValidationError && body.fieldErrors && Object.keys(body.fieldErrors).length > 0 && (
        <div style={{ display: 'grid', gap: 4 }}>
          {Object.entries(body.fieldErrors).map(([field, msgs]) => (
            <div key={field} style={{ fontSize: 12.5 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', color: '#991b1b', fontWeight: 700 }}>{field}</span>
              <span style={{ color: '#475569' }}>: {msgs.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {isValidationError && body.formErrors && body.formErrors.length > 0 && (
        <div style={{ color: '#991b1b', fontSize: 12.5 }}>⚠️ {body.formErrors.join('; ')}</div>
      )}
      <pre style={{ margin: 0, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 12, overflowX: 'auto' }}>
        {JSON.stringify(result.body, null, 2)}
      </pre>
    </div>
  );
}
