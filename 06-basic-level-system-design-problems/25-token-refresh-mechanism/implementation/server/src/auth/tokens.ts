import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

/** HMAC-SHA256 signature (base64url) over a string, keyed by the server secret. */
function sign(data: string): string {
  return createHmac('sha256', config.JWT_SECRET).update(data).digest('base64url');
}

/** Constant-time string comparison (avoids signature-timing side channels). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export interface AccessPayload {
  sub: string;
  iat: number;
  exp: number;
  type: 'access';
}

/** Mint a short-lived, stateless access token: base64url(payload).signature. */
export function signAccess(userId: string, ttlSec: number): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessPayload = { sub: userId, iat: now, exp: now + ttlSec, type: 'access' };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${body}.${sign(body)}`, expiresAt: payload.exp * 1000 };
}

/** Verify an access token by signature + expiry alone — no store lookup (stateless). */
export function verifyAccess(token: string): AccessPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!safeEqual(sig, sign(body))) return null;
  let payload: AccessPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (payload.type !== 'access') return null;
  if (Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

/** A refresh token is an opaque random id; the store tracks its state (revocable). */
export function newRefreshId(): string {
  return randomBytes(18).toString('base64url');
}

/** Wrap a refresh id with a signature so tampering is detectable before a store lookup. */
export function signRefreshToken(id: string): string {
  return `${id}.${sign('refresh:' + id)}`;
}

/** Extract + verify the id from a refresh token; null if tampered/malformed. */
export function parseRefreshToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [id, sig] = parts;
  if (!safeEqual(sig, sign('refresh:' + id))) return null;
  return id;
}
