export const REACTIONS = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const;
export type Reaction = (typeof REACTIONS)[number];

export function isReaction(x: unknown): x is Reaction {
  return typeof x === 'string' && (REACTIONS as readonly string[]).includes(x);
}

export type Counts = Record<Reaction, number>;

export function emptyCounts(): Counts {
  return { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
}

/**
 * Pure core of "one reaction per user, changeable". Given the user's previous reaction
 * and their new one, returns the count deltas to apply. This is what keeps counters
 * correct when a user switches 👍 → ❤️ (decrement old, increment new) or removes it.
 */
export function reactionDeltas(
  previous: Reaction | null,
  next: Reaction | null,
): Partial<Record<Reaction, number>> {
  const deltas: Partial<Record<Reaction, number>> = {};
  if (previous === next) return deltas; // no-op (idempotent re-send)
  if (previous) deltas[previous] = (deltas[previous] ?? 0) - 1;
  if (next) deltas[next] = (deltas[next] ?? 0) + 1;
  return deltas;
}

export function totalOf(counts: Counts): number {
  return REACTIONS.reduce((sum, r) => sum + (counts[r] ?? 0), 0);
}
