export type Op = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
export const FIELDS = ['id', 'name', 'email', 'age', 'city', 'status', 'createdAt'] as const;
export type Field = (typeof FIELDS)[number];

export interface Predicate {
  field: Field;
  op: Op;
  value: string | number;
}

export interface Query {
  where: Predicate[];
  sort?: { field: Field; dir: 'asc' | 'desc' };
  project?: Field[];
  limit?: number;
}

export interface Explain {
  strategy: 'IXSCAN' | 'COLLSCAN';
  indexUsed: string | null;
  kind: 'btree' | 'hash' | null;
  rowsExamined: number;
  rowsReturned: number;
  sorted: boolean;
  covered: boolean;
  tookMs: number;
  planReason: string;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  explain: Explain;
}

export interface IndexInfo {
  name: string;
  fields: string[];
  kind: 'btree' | 'hash';
  unique: boolean;
  entries: number;
}

export interface CreateIndexBody {
  name?: string;
  fields: Field[];
  kind: 'btree' | 'hash';
  unique: boolean;
}
