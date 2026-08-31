/**
 * Canonicalize a tag so `NodeJS`, `node.js`, and ` node js ` collapse to one tag: lowercase,
 * trim, collapse internal whitespace and separators to a single hyphen, strip stray symbols.
 */
export function normalizeTag(raw: string): string {
  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/[\s._]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((t) => normalizeTag(String(t))).filter(Boolean))];
}

/**
 * Build the Mongo filter for "posts with these tags", newest-first, with keyset pagination.
 * `mode` = 'all' → $all (AND); 'any' → $in (OR). `cursor` is the last-seen _id (paginate by
 * _id which is monotonic with insertion time — no slow skip/offset).
 */
export function buildTagQuery(
  tags: string[],
  mode: 'all' | 'any',
  cursor?: string | null,
): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  if (tags.length) q.tags = mode === 'all' ? { $all: tags } : { $in: tags };
  if (cursor) q._id = { $lt: cursor };
  return q;
}
