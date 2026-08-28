/** Mirrors the NestJS API contract. */
export interface Item {
  id: string;
  name: string;
  value: number;
}

export interface ItemRead {
  data: Item;
  cached: boolean;
  coalesced?: boolean;
  ms: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
  hitRatio: number;
}
