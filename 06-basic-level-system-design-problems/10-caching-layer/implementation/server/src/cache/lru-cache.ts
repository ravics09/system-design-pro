interface Entry<V> {
  value: V;
  expiresAt: number; // epoch ms; Infinity = no TTL
}

/**
 * A bounded LRU cache with per-entry TTL.
 *
 * Implemented on a JS `Map`, which preserves insertion order — so the FIRST key
 * is the least-recently-used and the LAST is the most-recently-used. On `get`
 * we delete + re-insert the key to move it to the MRU end (O(1)). On `set` past
 * capacity we evict the LRU key (the first one). Expired entries are treated as
 * misses and removed lazily on access.
 */
export class LruCache<V> {
  private readonly map = new Map<string, Entry<V>>();

  constructor(
    private readonly maxSize: number,
    private readonly defaultTtlMs: number,
  ) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key); // expired → lazy eviction
      return undefined;
    }
    // Move to most-recently-used position.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  /** Insert/update a key. Returns the evicted key if capacity forced an eviction. */
  set(key: string, value: V, ttlMs?: number): string | null {
    if (this.map.has(key)) this.map.delete(key); // re-insert to update recency
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.map.set(key, { value, expiresAt: ttl > 0 ? Date.now() + ttl : Infinity });

    if (this.map.size > this.maxSize) {
      const lruKey = this.map.keys().next().value as string | undefined;
      if (lruKey !== undefined) {
        this.map.delete(lruKey);
        return lruKey;
      }
    }
    return null;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  keys(): string[] {
    return [...this.map.keys()];
  }
}
