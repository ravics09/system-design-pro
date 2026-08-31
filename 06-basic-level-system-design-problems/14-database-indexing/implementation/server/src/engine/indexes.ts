import type { Op, Row } from './types';

/** Total order over the primitive values we index (numbers and strings). */
export function cmp(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

/** Lexicographic compare of composite (compound) keys. */
export function cmpKeys(a: readonly unknown[], b: readonly unknown[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const c = cmp(a[i], b[i]);
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

export function satisfies(value: unknown, op: Op, target: unknown): boolean {
  const c = cmp(value, target);
  switch (op) {
    case 'eq':
      return c === 0;
    case 'gt':
      return c > 0;
    case 'gte':
      return c >= 0;
    case 'lt':
      return c < 0;
    case 'lte':
      return c <= 0;
  }
}

/** Thrown when a unique index would be violated. */
export class UniqueViolationError extends Error {
  constructor(field: string, value: unknown) {
    super(`Unique index violation on [${field}] = ${JSON.stringify(value)}`);
    this.name = 'UniqueViolationError';
  }
}

/**
 * Hash index: O(1) exact-equality lookups on a single field. Cannot serve ranges
 * or provide ordering — exactly the trade-off a real hash index makes.
 */
export class HashIndex {
  readonly kind = 'hash' as const;
  private readonly map = new Map<string, number[]>();

  constructor(
    readonly name: string,
    readonly field: string,
  ) {}

  build(rows: Row[]): void {
    this.map.clear();
    for (const r of rows) {
      const k = String(r[this.field]);
      const bucket = this.map.get(k);
      if (bucket) bucket.push(r.id);
      else this.map.set(k, [r.id]);
    }
  }

  /** Returns matching ids and how many index entries were examined. */
  eq(value: unknown): { ids: number[]; examined: number } {
    const ids = this.map.get(String(value)) ?? [];
    return { ids, examined: ids.length };
  }

  get size(): number {
    let n = 0;
    for (const b of this.map.values()) n += b.length;
    return n;
  }
}

/**
 * B-tree-like index: entries kept sorted by a composite key, so it serves equality,
 * range, and ordered scans, and supports compound (multi-field) keys with left-prefix
 * matching. Modeled as a sorted array + binary search (same asymptotics as a B-tree
 * for our purposes: O(log n) seek + sequential range walk).
 */
export class BTreeIndex {
  readonly kind = 'btree' as const;
  private entries: { key: unknown[]; id: number }[] = [];

  constructor(
    readonly name: string,
    readonly fields: string[],
    readonly unique = false,
  ) {}

  build(rows: Row[]): void {
    this.entries = rows.map((r) => ({ key: this.fields.map((f) => r[f]), id: r.id }));
    this.entries.sort((a, b) => cmpKeys(a.key, b.key) || a.id - b.id);
    if (this.unique) {
      for (let i = 1; i < this.entries.length; i++) {
        if (cmpKeys(this.entries[i - 1].key, this.entries[i].key) === 0) {
          throw new UniqueViolationError(this.fields.join('+'), this.entries[i].key);
        }
      }
    }
  }

  /** Insert one row, enforcing uniqueness. Keeps entries sorted. */
  insert(row: Row): void {
    const key = this.fields.map((f) => row[f]);
    const pos = this.lowerBound(key, key.length);
    if (this.unique && pos < this.entries.length && cmpKeys(this.entries[pos].key.slice(0, key.length), key) === 0) {
      throw new UniqueViolationError(this.fields.join('+'), key);
    }
    this.entries.splice(pos, 0, { key, id: row.id });
  }

  /** First index position whose key prefix (length k) is >= target. */
  private lowerBound(target: readonly unknown[], k: number): number {
    let lo = 0;
    let hi = this.entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cmpKeys(this.entries[mid].key.slice(0, k), target) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /**
   * Seek the block of entries whose leading `eqValues` match, optionally narrowing by
   * a range predicate on the next key field. Returns ids in index order plus how many
   * index entries were examined (the selectivity signal).
   */
  search(
    eqValues: unknown[],
    range?: { op: Op; value: unknown },
  ): { ids: number[]; examined: number } {
    const k = eqValues.length;
    // Block of entries matching the equality prefix. With k=0 the block is everything.
    const start = k > 0 ? this.lowerBound(eqValues, k) : 0;
    const ids: number[] = [];
    let examined = 0;
    for (let i = start; i < this.entries.length; i++) {
      const key = this.entries[i].key;
      if (k > 0 && cmpKeys(key.slice(0, k), eqValues) !== 0) break; // left the prefix block
      examined++;
      if (range && !satisfies(key[k], range.op, range.value)) continue;
      ids.push(this.entries[i].id);
    }
    return { ids, examined };
  }

  get size(): number {
    return this.entries.length;
  }
}

export type AnyIndex = HashIndex | BTreeIndex;
