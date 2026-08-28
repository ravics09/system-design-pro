import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { SlowStore, type Item } from './slow-store';
import type { ItemReadView, UpdateItemInput } from './items.dto';

const keyFor = (id: string): string => `item:${id}`;

@Injectable()
export class ItemsService {
  constructor(
    private readonly cache: CacheService,
    private readonly store: SlowStore,
  ) {}

  /**
   * CACHE-ASIDE read: return the cached copy on a hit, otherwise load from the
   * slow origin (coalesced via single-flight) and populate the cache. The
   * response reports whether it was a cache hit and the end-to-end latency.
   */
  async getItem(id: string): Promise<ItemReadView> {
    const start = Date.now();
    const result = await this.cache.getOrLoad<Item>(keyFor(id), () => this.store.read(id));
    return {
      data: result.value,
      cached: result.cached,
      coalesced: result.coalesced,
      ms: Date.now() - start,
    };
  }

  /** WRITE-THROUGH update: write the origin, then refresh the cache entry. */
  async updateItem(id: string, patch: UpdateItemInput): Promise<Item> {
    const updated = await this.store.write(id, patch);
    this.cache.set(keyFor(id), updated); // keep the cache fresh (no stale read)
    return updated;
  }

  /** Delete + INVALIDATE the cached entry. */
  async deleteItem(id: string): Promise<void> {
    await this.store.remove(id);
    this.cache.del(keyFor(id));
  }

  list(): Item[] {
    return this.store.list();
  }

  /** Reset the origin (and its load counter) for demos/tests. */
  reset(): { count: number } {
    return this.store.reset();
  }

  loads(): { loads: number } {
    return { loads: this.store.loadCount };
  }
}
