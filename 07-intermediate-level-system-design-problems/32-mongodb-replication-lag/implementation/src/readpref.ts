export type Consistency = 'strong' | 'eventual';
export type ReadPreference = 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';

/**
 * Map a caller's consistency need to a MongoDB read preference:
 *  - 'strong'   → primary (read-your-writes; never stale)
 *  - 'eventual' → secondaryPreferred (scale reads onto secondaries; tolerate lag)
 * Pure + unit-tested.
 */
export function pickReadPreference(consistency: string | undefined): ReadPreference {
  return consistency === 'eventual' ? 'secondaryPreferred' : 'primary';
}
