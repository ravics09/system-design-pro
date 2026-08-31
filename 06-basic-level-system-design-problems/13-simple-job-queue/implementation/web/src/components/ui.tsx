'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { JobState } from '../types';

type Tone = 'neutral' | 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#eef1f5', fg: '#334155' },
  green: { bg: '#dcfce7', fg: '#166534' },
  red: { bg: '#fee2e2', fg: '#991b1b' },
  amber: { bg: '#fef3c7', fg: '#92400e' },
  blue: { bg: '#dbeafe', fg: '#1e40af' },
  purple: { bg: '#ede9fe', fg: '#5b21b6' },
  gray: { bg: '#f1f5f9', fg: '#64748b' },
};

/** Map a job state to a badge color so the board is scannable at a glance. */
export const STATE_TONE: Record<JobState, Tone> = {
  waiting: 'blue',
  delayed: 'purple',
  active: 'amber',
  completed: 'green',
  failed: 'red',
  dead: 'red',
};

export function Badge({
  label,
  value,
  tone = 'neutral',
  mono = false,
}: {
  label?: string;
  value: ReactNode;
  tone?: Tone;
  mono?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 6,
        alignItems: 'baseline',
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label && <span style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>}
      <span style={{ fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</span>
    </span>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
    ghost: { background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1' },
    danger: { background: '#fff', color: '#991b1b', border: '1px solid #fca5a5' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: '8px 14px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>
      {label}
      {children}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  padding: '7px 9px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 400,
  width: '100%',
  boxSizing: 'border-box',
};
