import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

/**
 * Minimal stateless token: base64url(userId).hmac(userId). Enough to authenticate the
 * WebSocket handshake in a demo; swap for full JWT/session in production.
 */
export function signToken(userId: string): string {
  const body = Buffer.from(userId).toString('base64url');
  const sig = createHmac('sha256', config.authSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', config.authSecret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(body, 'base64url').toString('utf8');
}
