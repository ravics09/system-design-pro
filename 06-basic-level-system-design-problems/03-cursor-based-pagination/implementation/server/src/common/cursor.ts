import { Types, type FilterQuery } from 'mongoose';

/**
 * The opaque cursor. It carries the sort-key value (`v`) of the last item on the
 * previous page plus that item's unique tie-breaker id (`id`). Clients treat it
 * as a black box; we base64url-encode it so its internals can evolve freely.
 *
 * NOTE: for a public/untrusted API you would additionally SIGN this token (HMAC)
 * so a tampered cursor is rejected rather than returning arbitrary data.
 */
export interface CursorPayload {
  v: string; // ISO timestamp of the sort field (createdAt) of the boundary row
  id: string; // the boundary row's _id (unique tie-breaker)
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/** Decode + validate a cursor. Returns null for a malformed token so the caller can 400. */
export function decodeCursor(token: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as CursorPayload;
    if (
      typeof parsed?.v !== 'string' ||
      typeof parsed?.id !== 'string' ||
      Number.isNaN(Date.parse(parsed.v)) ||
      !Types.ObjectId.isValid(parsed.id)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Build the keyset ("seek") filter for the page *after* the cursor, for a
 * descending sort on `(createdAt, _id)`.
 *
 * WHERE createdAt < v OR (createdAt = v AND _id < id)
 *
 * The tuple comparison is what makes paging deterministic even when many rows
 * share the same `createdAt`.
 */
export function keysetFilter<T>(cursor: CursorPayload): FilterQuery<T> {
  const boundaryDate = new Date(cursor.v);
  const boundaryId = new Types.ObjectId(cursor.id);
  return {
    $or: [
      { createdAt: { $lt: boundaryDate } },
      { createdAt: boundaryDate, _id: { $lt: boundaryId } },
    ],
  } as FilterQuery<T>;
}
