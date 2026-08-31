import type { AnyIndex } from './indexes';
import type { Op, Predicate, Query } from './types';

const RANGE_OPS: Op[] = ['gt', 'gte', 'lt', 'lte'];

export interface Plan {
  strategy: 'IXSCAN' | 'COLLSCAN';
  index: AnyIndex | null;
  indexName: string | null;
  kind: 'btree' | 'hash' | null;
  eqValues: unknown[];
  range?: { op: Op; value: unknown };
  providesSort: boolean;
  covered: boolean;
  reason: string;
}

function eqPredicate(where: Predicate[], field: string): Predicate | undefined {
  return where.find((p) => p.field === field && p.op === 'eq');
}
function rangePredicate(where: Predicate[], field: string): Predicate | undefined {
  return where.find((p) => p.field === field && RANGE_OPS.includes(p.op));
}

interface Candidate extends Plan {
  score: number;
}

/**
 * Pick the cheapest access path for a query, mimicking a cost-based planner:
 *  - a hash index serves a single-field equality in O(1);
 *  - a B-tree serves an equality prefix (ESR), an optional range on the next field,
 *    and can provide sort order for free;
 *  - otherwise we fall back to a full collection scan.
 * Candidates are scored by equality-prefix length, then range/sort/covered bonuses.
 */
export function planQuery(query: Query, indexes: AnyIndex[]): Plan {
  const where = query.where ?? [];
  const candidates: Candidate[] = [];

  for (const index of indexes) {
    if (index.kind === 'hash') {
      const eq = eqPredicate(where, index.field);
      if (!eq) continue;
      candidates.push({
        strategy: 'IXSCAN',
        index,
        indexName: index.name,
        kind: 'hash',
        eqValues: [eq.value],
        providesSort: false,
        covered: isCovered(query, [index.field]),
        reason: `hash index on ${index.field}: O(1) equality lookup`,
        // +1 over a b-tree's equality prefix so hash wins ties for pure equality (O(1)).
        score: 101 + (isCovered(query, [index.field]) ? 3 : 0),
      });
      continue;
    }

    // B-tree: longest equality prefix, then an optional range on the next field.
    const fields = index.fields;
    let eqLen = 0;
    const eqValues: unknown[] = [];
    while (eqLen < fields.length) {
      const eq = eqPredicate(where, fields[eqLen]);
      if (!eq) break;
      eqValues.push(eq.value);
      eqLen++;
    }
    const nextField = fields[eqLen];
    const range = nextField ? rangePredicate(where, nextField) : undefined;
    const sortField = query.sort?.field;
    const providesSort =
      !!sortField && (fields.slice(0, eqLen).includes(sortField) || sortField === nextField);

    const usable = eqLen >= 1 || (!!range && nextField === fields[0]) || (providesSort && sortField === fields[0]);
    if (!usable) continue;

    const covered = isCovered(query, fields);
    const score =
      eqLen * 100 + (range ? 10 : 0) + (providesSort ? 5 : 0) + (covered ? 3 : 0);
    candidates.push({
      strategy: 'IXSCAN',
      index,
      indexName: index.name,
      kind: 'btree',
      eqValues,
      range: range ? { op: range.op, value: range.value } : undefined,
      providesSort,
      covered,
      reason:
        `b-tree ${fields.join('+')}: ` +
        [
          eqLen ? `equality prefix on ${fields.slice(0, eqLen).join('+')}` : null,
          range ? `range on ${nextField}` : null,
          providesSort ? 'provides sort order' : null,
          covered ? 'covered (no document fetch)' : null,
        ]
          .filter(Boolean)
          .join(', '),
      score,
    });
  }

  if (candidates.length === 0) {
    return {
      strategy: 'COLLSCAN',
      index: null,
      indexName: null,
      kind: null,
      eqValues: [],
      providesSort: false,
      covered: false,
      reason: 'no usable index — full collection scan',
    };
  }

  candidates.sort((a, b) => b.score - a.score);
  const { score, ...best } = candidates[0];
  void score;
  return best;
}

/** A query is covered if every field it touches is present in the index. */
function isCovered(query: Query, indexFields: string[]): boolean {
  if (!query.project || query.project.length === 0) return false;
  const touched = new Set<string>();
  for (const p of query.where ?? []) touched.add(p.field);
  if (query.sort) touched.add(query.sort.field);
  for (const f of query.project) touched.add(f);
  const inIndex = new Set(indexFields);
  for (const f of touched) if (!inIndex.has(f)) return false;
  return true;
}
