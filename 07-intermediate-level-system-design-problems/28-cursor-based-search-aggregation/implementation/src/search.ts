/** Tokenize text into lowercased, de-duped search tokens. */
export function tokenize(text: string): string[] {
  return [...new Set(String(text).toLowerCase().match(/[a-z0-9]+/g) ?? [])];
}

/** Opaque cursor = base64url of the last-seen _id. */
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64url');
}
export function decodeCursor(cursor: string | undefined | null): string | null {
  if (!cursor) return null;
  try {
    const id = Buffer.from(cursor, 'base64url').toString('utf8');
    return /^[a-f0-9]{24}$/i.test(id) ? id : null; // must look like an ObjectId
  } catch {
    return null;
  }
}

/**
 * Build the aggregation $match: token AND ($all) + a keyset predicate (_id < cursor) so deep
 * pages stay O(page size) and don't drift when documents are inserted between pages.
 */
export function buildMatch(tokens: string[], cursorId: string | null): Record<string, unknown> {
  const match: Record<string, unknown> = {};
  if (tokens.length) match.tokens = { $all: tokens };
  if (cursorId) match._id = { $lt: cursorId };
  return match;
}
