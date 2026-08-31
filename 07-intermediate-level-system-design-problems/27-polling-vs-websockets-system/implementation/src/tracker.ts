import { EventEmitter } from 'node:events';

export interface Position {
  version: number;
  lat: number;
  lng: number;
  at: number;
}

/**
 * A tiny shared state (a moving delivery position). Each update bumps a monotonic version so
 * long-pollers/clients can request "give me state newer than V". The version is what lets a
 * long-poll wait for genuine change and lets clients coalesce/skip stale updates.
 */
export class Tracker extends EventEmitter {
  private pos: Position = { version: 0, lat: 40.7128, lng: -74.006, at: Date.now() };

  current(): Position {
    return this.pos;
  }

  /** Advance the position; returns the new versioned state and notifies subscribers. */
  update(dLat = 0.001, dLng = 0.001): Position {
    this.pos = { version: this.pos.version + 1, lat: this.pos.lat + dLat, lng: this.pos.lng + dLng, at: Date.now() };
    this.emit('update', this.pos);
    return this.pos;
  }

  /** For long polling: the current state only if it's newer than `sinceVersion`, else null. */
  since(sinceVersion: number): Position | null {
    return this.pos.version > sinceVersion ? this.pos : null;
  }
}

/** Coalesce a burst of updates to just the latest (what you push instead of every tick). */
export function coalesce(updates: Position[]): Position | null {
  return updates.length ? updates.reduce((a, b) => (b.version > a.version ? b : a)) : null;
}
