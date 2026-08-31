/**
 * One vote per user, changeable. Given the user's previous option and their new choice,
 * return the count deltas to apply. Re-sending the same option is a no-op (idempotent).
 * Pure + unit-tested.
 */
export function voteDeltas(previous: string | null, next: string): Partial<Record<string, number>> {
  const deltas: Partial<Record<string, number>> = {};
  if (previous === next) return deltas;
  if (previous) deltas[previous] = (deltas[previous] ?? 0) - 1;
  deltas[next] = (deltas[next] ?? 0) + 1;
  return deltas;
}

/** Total votes across options. */
export function totalVotes(counts: Record<string, number | string>): number {
  let total = 0;
  for (const v of Object.values(counts)) total += Number(v) || 0;
  return total;
}
