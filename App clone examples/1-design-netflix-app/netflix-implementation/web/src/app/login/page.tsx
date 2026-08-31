'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const action = mode === 'login' ? login : register;
    const res = await action({ email, password });
    if ('data' in res && res.data) {
      dispatch(setCredentials(res.data));
      router.replace('/profiles');
    } else {
      const err = res.error as { data?: { message?: string } } | undefined;
      setError(err?.data?.message ?? (mode === 'login' ? 'Invalid email or password' : 'Could not register'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 4%' }}>
        <span className="brand" style={{ fontSize: '1.6rem' }}>NETFLIX</span>
      </div>
      <div className="centered" style={{ flex: 1 }}>
        <form onSubmit={submit} style={{ width: 'min(420px, 92%)', background: 'rgba(0,0,0,0.75)', padding: 32, borderRadius: 8 }}>
          <h1 style={{ marginTop: 0 }}>{mode === 'login' ? 'Sign In' : 'Sign Up'}</h1>
          <div style={{ display: 'grid', gap: 12 }}>
            <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {error && <div style={{ color: '#e87c03', fontSize: 14 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            {mode === 'login' ? 'New to Netflix?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>
              {mode === 'login' ? 'Sign up now.' : 'Sign in.'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
