'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginMutation, useRegisterMutation } from '../../store/api';
import { setCredentials } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const busy = loginState.isLoading || registerState.isLoading;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const action = mode === 'login' ? login : register;
    const res = await action({ email, password });
    if ('data' in res && res.data) {
      dispatch(setCredentials(res.data));
      router.replace('/');
    } else {
      const err = res.error as { data?: { message?: string } } | undefined;
      setError(err?.data?.message ?? (mode === 'login' ? 'Invalid email or password' : 'Could not register'));
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: '40px auto' }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0, fontSize: '1.6rem' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Password
            <input
              className="input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          style={{ background: 'none', border: 'none', color: 'var(--link)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {mode === 'login' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
      <p className="muted" style={{ textAlign: 'center' }}>
        <Link href="/">← Continue shopping</Link>
      </p>
    </div>
  );
}
