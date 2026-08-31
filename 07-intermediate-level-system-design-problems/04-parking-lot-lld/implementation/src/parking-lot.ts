import { randomUUID } from 'node:crypto';
import {
  HourlyPricing,
  Size,
  canFit,
  type ParkingSpot,
  type PricingStrategy,
  type Ticket,
  type Vehicle,
} from './domain';

export interface LotLayout {
  levels: number;
  perLevel: Record<Size, number>;
}

/**
 * The ParkingLot orchestrates allocation and ticketing. Free spots are kept in per-size
 * stacks so allocation is O(1) best-fit: try the exact size, then the next larger. JS is
 * single-threaded, so a synchronous pop is atomic → no double-booking within a process.
 */
export class ParkingLot {
  private readonly spots = new Map<string, ParkingSpot>();
  private readonly free: Record<Size, string[]> = {
    [Size.MOTORCYCLE]: [],
    [Size.COMPACT]: [],
    [Size.LARGE]: [],
  };
  private readonly tickets = new Map<string, Ticket>();

  constructor(layout: LotLayout, private readonly pricing: PricingStrategy = new HourlyPricing()) {
    for (let level = 0; level < layout.levels; level++) {
      for (const size of [Size.MOTORCYCLE, Size.COMPACT, Size.LARGE]) {
        for (let i = 0; i < layout.perLevel[size]; i++) {
          const id = `L${level}-${Size[size]}-${i}`;
          this.spots.set(id, { id, level, size, occupiedBy: null });
          this.free[size].push(id);
        }
      }
    }
  }

  /** Allocate the smallest fitting free spot (best-fit). Returns a ticket or null if full. */
  park(vehicle: Vehicle, now = Date.now()): Ticket | null {
    for (let size = vehicle.size as number; size <= Size.LARGE; size++) {
      const spotId = this.free[size as Size].pop(); // atomic claim
      if (spotId) {
        const spot = this.spots.get(spotId)!;
        if (!canFit(vehicle.size, spot.size)) continue; // defensive
        spot.occupiedBy = vehicle.plate;
        const ticket: Ticket = { id: randomUUID(), plate: vehicle.plate, spotId, level: spot.level, entryTime: now };
        this.tickets.set(ticket.id, ticket);
        return ticket;
      }
    }
    return null; // no fitting spot free
  }

  /** Free the spot and price the stay. Idempotent-safe: unknown/again returns null. */
  unpark(ticketId: string, now = Date.now()): { feeCents: number; durationMs: number } | null {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;
    const spot = this.spots.get(ticket.spotId)!;
    const durationMs = now - ticket.entryTime;
    const feeCents = this.pricing.priceCents(durationMs, spot.size);
    spot.occupiedBy = null;
    this.free[spot.size].push(spot.id);
    this.tickets.delete(ticketId);
    return { feeCents, durationMs };
  }

  availability(): { total: number; free: number; byLevel: Record<number, Record<string, number>> } {
    const byLevel: Record<number, Record<string, number>> = {};
    let free = 0;
    for (const spot of this.spots.values()) {
      byLevel[spot.level] ??= { motorcycle: 0, compact: 0, large: 0 };
      if (!spot.occupiedBy) {
        free++;
        byLevel[spot.level][Size[spot.size].toLowerCase()]++;
      }
    }
    return { total: this.spots.size, free, byLevel };
  }
}
