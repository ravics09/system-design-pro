import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing with scrypt (a slow, memory-hard KDF) + a per-user salt — no native
 * dependency (bcrypt/argon2 need a native build). Format: `scrypt$<salt>$<derivedKey>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${dk.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, dkB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !dkB64) return false;
  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(dkB64, 'base64url');
  const dk = scryptSync(password, salt, expected.length);
  return dk.length === expected.length && timingSafeEqual(dk, expected);
}

/** SHA-256 (base64url) — used to store refresh tokens hashed (never in plaintext). */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

/** A cryptographically-random opaque token (for refresh tokens). */
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}
