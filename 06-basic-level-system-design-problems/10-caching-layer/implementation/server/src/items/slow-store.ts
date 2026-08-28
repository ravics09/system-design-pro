import { Injectable, NotFoundException } from '@nestjs/common';
import { config } from '../config';

export interface Item {
  id: string;
  name: string;
  value: number;
}

/**
 * The "origin" — a stand-in for a slow database. Every read sleeps for
 * ORIGIN_LATENCY_MS so the miss-vs-hit latency gap is visible, and counts loads
 * so tests can prove single-flight (one origin load for N concurrent misses).
 */
@Injectable()
export class SlowStore {
  private data = new Map<string, Item>();
  private loads = 0;

  constructor() {
    this.reset();
  }

  reset(): { count: number } {
    this.data = new Map(
      Array.from({ length: 5 }, (_, i) => {
        const id = String(i + 1);
        return [id, { id, name: `Item ${id}`, value: (i + 1) * 100 }] as const;
      }),
    );
    this.loads = 0;
    return { count: this.data.size };
  }

  get loadCount(): number {
    return this.loads;
  }

  /** Simulate a slow read from the origin. Throws 404 for unknown ids. */
  async read(id: string): Promise<Item> {
    await sleep(config.ORIGIN_LATENCY_MS);
    this.loads += 1;
    const item = this.data.get(id);
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return { ...item };
  }

  async write(id: string, patch: Partial<Pick<Item, 'name' | 'value'>>): Promise<Item> {
    await sleep(config.ORIGIN_LATENCY_MS);
    const existing = this.data.get(id);
    if (!existing) throw new NotFoundException(`Item ${id} not found`);
    const updated = { ...existing, ...patch };
    this.data.set(id, updated);
    return { ...updated };
  }

  async remove(id: string): Promise<void> {
    if (!this.data.delete(id)) throw new NotFoundException(`Item ${id} not found`);
  }

  list(): Item[] {
    return [...this.data.values()];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
