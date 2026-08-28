import { Injectable } from '@nestjs/common';
import { LruCache } from './lru-cache';
import { config } from '../config';

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
  hitRatio: number;
}

export interface LoadResult<V> {
  value: V;
  cached: boolean; // true = served from cache, false = loaded from origin
  coalesced?: boolean; // true = joined an in-flight load (single-flight)
}

/**
 * The caching layer. Wraps an LRU+TTL store with:
 *  - hit/miss/eviction METRICS (hit ratio is the north-star),
 *  - `getOrLoad` = CACHE-ASIDE with SINGLE-FLIGHT so a hot-key miss storm
 *    triggers exactly one origin load (stampede protection).
 */
@Injectable()
export class CacheService {
  private readonly lru = new LruCache<unknown>(config.CACHE_MAX, config.CACHE_TTL_MS);
  private readonly inflight = new Map<string, Promise<unknown>>();

  private hits = 0;
  private misses = 0;
  private sets = 0;
  private evictions = 0;

  get<V>(key: string): V | undefined {
    const value = this.lru.get(key) as V | undefined;
    if (value === undefined) this.misses += 1;
    else this.hits += 1;
    return value;
  }

  set<V>(key: string, value: V, ttlMs?: number): void {
    const evicted = this.lru.set(key, value, ttlMs);
    this.sets += 1;
    if (evicted !== null) this.evictions += 1;
  }

  del(key: string): void {
    this.lru.delete(key);
  }

  /**
   * Cache-aside read with single-flight. On a hit, return immediately. On a miss,
   * either start the one origin load or await the load already in flight for this
   * key, then populate the cache.
   */
  async getOrLoad<V>(key: string, loader: () => Promise<V>, ttlMs?: number): Promise<LoadResult<V>> {
    const cached = this.get<V>(key);
    if (cached !== undefined) return { value: cached, cached: true };

    const existing = this.inflight.get(key) as Promise<V> | undefined;
    if (existing) {
      const value = await existing;
      return { value, cached: false, coalesced: true };
    }

    const promise = loader()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);
    const value = await promise;
    return { value, cached: false };
  }

  /** Flush everything and reset metrics (demo/testing convenience). */
  clear(): void {
    this.lru.clear();
    this.inflight.clear();
    this.hits = this.misses = this.sets = this.evictions = 0;
  }

  keys(): string[] {
    return this.lru.keys();
  }

  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      evictions: this.evictions,
      size: this.lru.size,
      hitRatio: total === 0 ? 0 : Number((this.hits / total).toFixed(4)),
    };
  }
}
