/**
 * Monotonic, time-sortable message id generator (Snowflake-lite).
 * Layout: <millis since epoch>-<zero-padded per-ms sequence>. Lexicographically
 * sortable === chronologically sortable, and unique within a single process even
 * when many messages land in the same millisecond.
 */
let lastMs = 0;
let seq = 0;

export function nextMessageId(now: number = Date.now()): string {
  if (now === lastMs) {
    seq += 1;
  } else {
    lastMs = now;
    seq = 0;
  }
  // 13-digit ms timestamp + 5-digit sequence keeps lexical order == time order.
  return `${now.toString().padStart(13, '0')}-${seq.toString().padStart(5, '0')}`;
}
