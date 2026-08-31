import type { Row } from './types';

const FIRST = ['Ada', 'Alan', 'Grace', 'Linus', 'Katherine', 'Dennis', 'Barbara', 'Guido', 'Margaret', 'Ken'];
const LAST = ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Johnson', 'Ritchie', 'Liskov', 'Rossum', 'Hamilton', 'Thompson'];
const CITIES = ['London', 'Paris', 'Berlin', 'Tokyo', 'Austin', 'Toronto', 'Mumbai', 'Sydney'];
const STATUSES: Row['status'][] = ['active', 'inactive', 'pending'];

/** A tiny deterministic PRNG (mulberry32) so seeds are reproducible across runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `size` deterministic rows. `email` is unique (id-suffixed) so it can back a
 * unique index; other fields are low/medium cardinality to show selectivity effects.
 */
export function generateRows(size: number): Row[] {
  const rnd = mulberry32(size * 2654435761);
  const rows: Row[] = new Array(size);
  const base = Date.UTC(2024, 0, 1);
  for (let i = 0; i < size; i++) {
    const first = FIRST[Math.floor(rnd() * FIRST.length)];
    const last = LAST[Math.floor(rnd() * LAST.length)];
    rows[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}.${i + 1}`.toLowerCase() + '@example.com',
      age: 18 + Math.floor(rnd() * 60),
      city: CITIES[Math.floor(rnd() * CITIES.length)],
      status: STATUSES[Math.floor(rnd() * STATUSES.length)],
      createdAt: base + Math.floor(rnd() * 365 * 24 * 3600 * 1000),
    };
  }
  return rows;
}
