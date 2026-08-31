import { performance } from 'node:perf_hooks';
import { generateRows } from './dataset';
import { AnyIndex, BTreeIndex, HashIndex, cmp, satisfies } from './indexes';
import { planQuery } from './planner';
import type { CreateIndexInput, Explain, IndexInfo, Query, Row } from './types';

export interface QueryResult {
  rows: Partial<Row>[];
  explain: Explain;
}

/**
 * The mini database: an in-memory collection plus a set of secondary indexes, with a
 * planner that chooses between an index scan and a full scan and reports an EXPLAIN.
 */
export class IndexEngine {
  private rows: Row[] = [];
  private byId = new Map<number, Row>();
  private indexes = new Map<string, AnyIndex>();

  constructor(seedSize: number) {
    this.seed(seedSize);
  }

  /** Replace the dataset and rebuild every existing index against it. */
  seed(size: number): { size: number } {
    this.rows = generateRows(size);
    this.byId = new Map(this.rows.map((r) => [r.id, r]));
    for (const idx of this.indexes.values()) this.rebuild(idx);
    return { size: this.rows.length };
  }

  private rebuild(idx: AnyIndex): void {
    idx.build(this.rows);
  }

  createIndex(spec: CreateIndexInput): IndexInfo {
    const name = spec.name ?? `${spec.fields.join('_')}_${spec.kind}`;
    if (this.indexes.has(name)) throw new Error(`Index '${name}' already exists`);
    let idx: AnyIndex;
    if (spec.kind === 'hash') {
      idx = new HashIndex(name, spec.fields[0]); // hash is single-field
    } else {
      idx = new BTreeIndex(name, spec.fields, spec.unique);
    }
    idx.build(this.rows); // may throw UniqueViolationError
    this.indexes.set(name, idx);
    return this.describe(idx);
  }

  dropIndex(name: string): boolean {
    return this.indexes.delete(name);
  }

  listIndexes(): IndexInfo[] {
    return [...this.indexes.values()].map((i) => this.describe(i));
  }

  private describe(idx: AnyIndex): IndexInfo {
    return {
      name: idx.name,
      fields: idx.kind === 'hash' ? [idx.field] : idx.fields,
      kind: idx.kind,
      unique: idx.kind === 'btree' ? idx.unique : false,
      entries: idx.size,
    };
  }

  stats(): { rows: number; indexes: number } {
    return { rows: this.rows.length, indexes: this.indexes.size };
  }

  reset(seedSize: number): void {
    this.indexes.clear();
    this.seed(seedSize);
  }

  /** Run a query: plan → fetch candidates → filter → sort → project → limit, with EXPLAIN. */
  run(query: Query): QueryResult {
    const start = performance.now();
    const plan = planQuery(query, [...this.indexes.values()]);
    const where = query.where ?? [];

    let candidates: Row[];
    let rowsExamined: number;

    if (plan.strategy === 'COLLSCAN' || !plan.index) {
      candidates = this.rows;
      rowsExamined = this.rows.length;
    } else if (plan.index.kind === 'hash') {
      const { ids, examined } = plan.index.eq(plan.eqValues[0]);
      candidates = ids.map((id) => this.byId.get(id)!);
      rowsExamined = examined;
    } else {
      const { ids, examined } = plan.index.search(plan.eqValues, plan.range);
      candidates = ids.map((id) => this.byId.get(id)!);
      rowsExamined = examined;
    }

    // Re-check all predicates (cheap, and correct even if the index only narrowed).
    let matched = candidates.filter((r) => where.every((p) => satisfies(r[p.field], p.op, p.value)));

    // Sort: skip the in-memory stage when the index already returns rows in order.
    let sortedStage = false;
    if (query.sort) {
      if (plan.strategy === 'IXSCAN' && plan.providesSort) {
        if (query.sort.dir === 'desc') matched = matched.slice().reverse();
      } else {
        const { field, dir } = query.sort;
        const sign = dir === 'desc' ? -1 : 1;
        matched = matched.slice().sort((a, b) => sign * cmp(a[field], b[field]));
        sortedStage = true;
      }
    }

    const rowsReturned = matched.length;
    if (query.limit) matched = matched.slice(0, query.limit);

    const rows: Partial<Row>[] = query.project
      ? matched.map((r) => Object.fromEntries(query.project!.map((f) => [f, r[f]])) as Partial<Row>)
      : matched;

    const explain: Explain = {
      strategy: plan.strategy,
      indexUsed: plan.indexName,
      kind: plan.kind,
      rowsExamined,
      rowsReturned,
      sorted: sortedStage,
      covered: plan.covered,
      tookMs: Math.round((performance.now() - start) * 1000) / 1000,
      planReason: plan.reason,
    };
    return { rows, explain };
  }
}
