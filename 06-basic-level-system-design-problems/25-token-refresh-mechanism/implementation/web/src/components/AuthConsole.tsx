'use client';

import { useEffect, useState } from 'react';
import { useLoginMutation, useLogoutMutation, useMeMutation, useRefreshMutation } from '../store/authApi';
import type { TokenPair } from '../types';
import { Badge, Button, Card, short } from './ui';

interface LogLine {
  at: number;
  msg: string;
  tone: 'green' | 'red' | 'amber' | 'neutral';
}

export function AuthConsole() {
  const [login] = useLoginMutation();
  const [refresh] = useRefreshMutation();
  const [logout] = useLogoutMutation();
  const [me] = useMeMutation();

  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [prevRefresh, setPrevRefresh] = useState<string | null>(null); // the just-rotated (now used) token
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState<LogLine[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const add = (msg: string, tone: LogLine['tone'] = 'neutral') =>
    setLog((l) => [{ at: Date.now(), msg, tone }, ...l].slice(0, 8));

  const doLogin = async (username: string, password: string) => {
    const res = await login({ username, password }).unwrap();
    if (res.status === 201) {
      setTokens(res.body as TokenPair);
      setPrevRefresh(null);
      add(`Logged in as ${username} — access + refresh issued`, 'green');
    } else {
      add('Login failed', 'red');
    }
  };

  const callMe = async () => {
    if (!tokens) return;
    const res = await me(tokens.accessToken).unwrap();
    add(res.status === 200 ? `/me → userId ${(res.body as { userId: string }).userId}` : '/me → 401 (access token invalid/expired)', res.status === 200 ? 'green' : 'red');
  };

  const doRefresh = async () => {
    if (!tokens) return;
    const res = await refresh(tokens.refreshToken).unwrap();
    if (res.status === 201) {
      setPrevRefresh(tokens.refreshToken); // this one is now "used" — replaying it is the attack
      setTokens(res.body as TokenPair);
      add('Refreshed — rotated to a NEW refresh token (old one is now used)', 'green');
    } else {
      add('Refresh failed (token invalid/expired/revoked)', 'red');
    }
  };

  const replayAttack = async () => {
    if (!prevRefresh) {
      add('Refresh at least once first, then replay the old token', 'amber');
      return;
    }
    const res = await refresh(prevRefresh).unwrap();
    if (res.status === 401) {
      add('🚨 Replayed the USED refresh token → reuse detected → FAMILY REVOKED', 'amber');
      // The current token is now also revoked; prove it:
      if (tokens) {
        const after = await refresh(tokens.refreshToken).unwrap();
        add(after.status === 401 ? 'Current refresh token is now dead too (whole family revoked)' : 'Unexpected: current token still works', after.status === 401 ? 'red' : 'amber');
      }
    } else {
      add('Replay unexpectedly succeeded', 'amber');
    }
  };

  const doLogout = async (allDevices: boolean) => {
    if (!tokens) return;
    await logout({ refreshToken: tokens.refreshToken, allDevices }).unwrap();
    add(`Logged out${allDevices ? ' (all devices)' : ''} — refresh token revoked`, 'neutral');
    setTokens(null);
    setPrevRefresh(null);
  };

  const remaining = tokens ? Math.max(0, Math.round((tokens.accessExpiresAt - now) / 1000)) : 0;

  return (
    <Card title="Auth console" right={tokens ? <Badge label="user" value={tokens.user.username} tone="blue" /> : <Badge value="logged out" tone="gray" />}>
      {!tokens ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => doLogin('alice', 'password123')}>Login as alice</Button>
          <Button variant="ghost" onClick={() => doLogin('bob', 'hunter2')}>Login as bob</Button>
          <Button variant="ghost" onClick={() => doLogin('alice', 'wrong')}>Login (wrong password)</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge label="access expires in" value={`${remaining}s`} tone={remaining > 60 ? 'green' : remaining > 0 ? 'amber' : 'red'} />
            <Badge label="access" value={short(tokens.accessToken)} tone="gray" mono />
            <Badge label="refresh" value={short(tokens.refreshToken)} tone="gray" mono />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={callMe}>Call /me</Button>
            <Button onClick={doRefresh}>Refresh (rotate)</Button>
            <Button variant="danger" onClick={replayAttack}>Replay old token (attack)</Button>
            <Button variant="ghost" onClick={() => doLogout(false)}>Logout</Button>
            <Button variant="ghost" onClick={() => doLogout(true)}>Logout all</Button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'grid', gap: 4 }}>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 12.5, color: l.tone === 'red' ? '#991b1b' : l.tone === 'green' ? '#166534' : l.tone === 'amber' ? '#92400e' : '#475569' }}>
            <span style={{ color: '#94a3b8' }}>{new Date(l.at).toLocaleTimeString()} </span>
            {l.msg}
          </div>
        ))}
      </div>
    </Card>
  );
}
