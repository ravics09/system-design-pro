import argon2 from "argon2";

/**
 * Password hashing with Argon2id — a memory-hard, deliberately slow algorithm
 * designed for password storage. Never use a fast general-purpose hash (SHA-256)
 * for passwords: it is far too cheap to brute-force at scale.
 *
 * Passwords are HASHED, not encrypted — there is no decrypt step by design.
 */
const options: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, options);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed/legacy hash should be treated as a non-match, not an error.
    return false;
  }
}
