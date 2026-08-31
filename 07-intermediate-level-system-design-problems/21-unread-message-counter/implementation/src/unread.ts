/** Sum a per-conversation unread hash into the total badge. Pure + testable. */
export function sumCounts(perConversation: Record<string, number | string>): number {
  let total = 0;
  for (const v of Object.values(perConversation)) total += Math.max(0, Number(v) || 0);
  return total;
}

/** Clamp a counter so a stray double-decrement can never make unread go negative. */
export function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}
