/**
 * Hybrid fan-out decision: push to followers' feeds on write ONLY for non-celebrity authors.
 * Celebrities (follower count over the threshold) skip fan-out to avoid the write storm; their
 * followers pull the recent posts at read time instead.
 */
export function shouldFanout(followerCount: number, threshold: number): boolean {
  return followerCount <= threshold;
}

/**
 * Merge several time-sorted-desc lists of post ids into one deduped, time-sorted-desc timeline.
 * Post ids are lexicographically time-sortable (see makePostId), so string compare == time order.
 */
export function mergeTimelines(lists: string[][], limit: number): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) for (const id of list) if (!seen.has(id)) { seen.add(id); merged.push(id); }
  merged.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)); // newest first
  return merged.slice(0, limit);
}

let seq = 0;
let lastMs = 0;
/** Monotonic, lexicographically time-sortable post id. */
export function makePostId(now = Date.now()): string {
  if (now === lastMs) seq += 1;
  else { lastMs = now; seq = 0; }
  return `${now.toString().padStart(13, '0')}-${seq.toString().padStart(5, '0')}`;
}
