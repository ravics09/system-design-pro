import type { SessionOptions } from 'express-session';

/**
 * Build hardened session cookie options. In production cookies are Secure (HTTPS-only);
 * HttpOnly (no JS access → mitigates XSS token theft) and SameSite (CSRF mitigation) always.
 * Pure + testable.
 */
export function buildCookieOptions(env: string, ttlSeconds: number): NonNullable<SessionOptions['cookie']> {
  return {
    httpOnly: true,
    secure: env === 'production',
    sameSite: 'lax',
    maxAge: ttlSeconds * 1000,
  };
}
