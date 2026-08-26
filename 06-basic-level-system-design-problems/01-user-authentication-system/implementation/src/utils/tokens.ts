import { randomBytes, createHash, randomUUID } from "node:crypto";

/**
 * Refresh tokens (and password-reset tokens) are OPAQUE random strings, not
 * JWTs. We hand the raw token to the client but persist only its SHA-256 hash,
 * so a database leak cannot be used to mint sessions. Lookups hash the presented
 * token and compare against the stored hash.
 */

/** Generate a high-entropy, URL-safe opaque token. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Deterministic hash used as the stored/lookup key for an opaque token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A fresh rotation-family id, created on login and carried through rotations. */
export function newFamilyId(): string {
  return randomUUID();
}
