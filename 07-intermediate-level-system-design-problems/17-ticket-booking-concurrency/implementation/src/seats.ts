export type SeatStatus = 'free' | 'held' | 'booked';

export interface SeatState {
  status: SeatStatus;
  heldBy: string | null;
  heldUntil: number | null;
}

/** A seat is holdable if it's free, or held but the hold has expired (reclaimable). Pure. */
export function isHoldable(seat: SeatState, now: number): boolean {
  if (seat.status === 'free') return true;
  if (seat.status === 'held' && seat.heldUntil !== null && seat.heldUntil <= now) return true;
  return false;
}

/** A seat is confirmable only if the same user currently holds it and the hold hasn't expired. */
export function isConfirmable(seat: SeatState, userId: string, now: number): boolean {
  return seat.status === 'held' && seat.heldBy === userId && (seat.heldUntil ?? 0) > now;
}
