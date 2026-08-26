/**
 * Base62 encoding of a monotonically increasing integer id.
 *
 * A counter guarantees uniqueness by construction (no collision-check loop), and
 * Base62 keeps codes compact: 62^7 ≈ 3.5 trillion codes fit in 7 characters.
 *
 * NOTE on enumeration: a raw counter produces guessable, ordered codes. If hiding
 * volume/order matters, run the counter through a reversible permutation (e.g. a
 * Feistel network or multiply-by-coprime mod 62^n) before encoding — the code
 * stays unique and decodable but looks random. Kept simple here.
 */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length; // 62

export function encodeBase62(num: number): string {
  if (!Number.isInteger(num) || num < 0) {
    throw new Error('encodeBase62 requires a non-negative integer');
  }
  if (num === 0) return ALPHABET[0];
  let n = num;
  let out = '';
  while (n > 0) {
    out = ALPHABET[n % BASE] + out;
    n = Math.floor(n / BASE);
  }
  return out;
}

export function decodeBase62(code: string): number {
  let n = 0;
  for (const ch of code) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Base62 character: ${ch}`);
    n = n * BASE + idx;
  }
  return n;
}
