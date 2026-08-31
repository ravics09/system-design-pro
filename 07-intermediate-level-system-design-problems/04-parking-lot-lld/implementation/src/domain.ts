// Vehicle and spot sizes as an ordered scale so "fits" is a simple comparison.
export enum Size {
  MOTORCYCLE = 0,
  COMPACT = 1,
  LARGE = 2,
}

export const SIZE_NAMES: Record<Size, string> = {
  [Size.MOTORCYCLE]: 'motorcycle',
  [Size.COMPACT]: 'compact',
  [Size.LARGE]: 'large',
};

export interface Vehicle {
  plate: string;
  size: Size;
}

/** A vehicle fits a spot iff the spot is at least as large as the vehicle. */
export function canFit(vehicleSize: Size, spotSize: Size): boolean {
  return spotSize >= vehicleSize;
}

export interface ParkingSpot {
  id: string;
  level: number;
  size: Size;
  occupiedBy: string | null; // plate
}

export interface Ticket {
  id: string;
  plate: string;
  spotId: string;
  level: number;
  entryTime: number;
}

/** Strategy: pluggable pricing. Add new rules without touching the lot. */
export interface PricingStrategy {
  priceCents(durationMs: number, size: Size): number;
}

export class HourlyPricing implements PricingStrategy {
  constructor(private readonly ratePerHourCents: Record<Size, number> = {
    [Size.MOTORCYCLE]: 100,
    [Size.COMPACT]: 200,
    [Size.LARGE]: 300,
  }) {}

  priceCents(durationMs: number, size: Size): number {
    const hours = Math.max(1, Math.ceil(durationMs / 3_600_000)); // round up, min 1h
    return hours * this.ratePerHourCents[size];
  }
}
