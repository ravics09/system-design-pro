import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

export interface AccessPayload {
  sub: string; // userId
  iat: number;
  exp: number;
}

function sign(body: string): string {
  return createHmac('sha256', config.JWT_ACCESS_SECRET).update(body).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Mint a short-lived, stateless access token: base64url(payload).hmac. */
export function signAccessToken(userId: string): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessPayload = { sub: userId, iat: now, exp: now + config.ACCESS_TTL_S };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign(body)}`, expiresAt: payload.exp * 1000 };
}

/** Verify by signature + expiry only — no database lookup (stateless). */
export function verifyAccessToken(token: string): AccessPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!safeEqual(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AccessPayload;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
