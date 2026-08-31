/**
 * Cache key helpers. The entity key is invalidated directly on write; list keys embed a
 * category *version* so bumping the version instantly invalidates the whole group without
 * scanning/deleting individual keys (old keys become unreachable and expire via TTL).
 */
export function productKey(id: string): string {
  return `product:${id}`;
}

export function categoryVersionKey(category: string): string {
  return `catver:${category}`;
}

/** Versioned/namespaced list key → group invalidation is a single version bump. */
export function categoryListKey(category: string, version: number): string {
  return `cat:${category}:v${version}:products`;
}
