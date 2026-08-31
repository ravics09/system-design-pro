export const LADDER = [240, 480, 720, 1080, 2160];

/**
 * Pure: pick the transcode renditions for a source of a given height — never upscale, so we
 * only produce resolutions at or below the source (plus the source itself). This is the core
 * decision a transcoder makes; kept pure so it's unit-testable without ffmpeg.
 */
export function planRenditions(sourceHeight: number): number[] {
  const below = LADDER.filter((h) => h < sourceHeight);
  return [...below, sourceHeight].filter((h, i, a) => a.indexOf(h) === i).sort((a, b) => a - b);
}

/** Valid job status transitions (a small state machine guarding idempotent processing). */
export type Status = 'queued' | 'processing' | 'ready' | 'failed';
const ALLOWED: Record<Status, Status[]> = {
  queued: ['processing'],
  processing: ['ready', 'failed', 'queued'], // queued = requeue after a lease expiry
  ready: [],
  failed: ['queued'],
};
export function canTransition(from: Status, to: Status): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}
