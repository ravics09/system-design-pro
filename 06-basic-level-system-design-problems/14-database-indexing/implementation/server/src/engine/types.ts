import { z } from 'zod';

/** A dataset row (the "document"). id is the primary key. */
export interface Row {
  id: number;
  name: string;
  email: string;
  age: number;
  city: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: number;
  [key: string]: unknown;
}

export type Op = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export const QUERYABLE_FIELDS = ['id', 'name', 'email', 'age', 'city', 'status', 'createdAt'] as const;

export const predicateSchema = z.object({
  field: z.enum(QUERYABLE_FIELDS),
  op: z.enum(['eq', 'gt', 'gte', 'lt', 'lte']),
  value: z.union([z.string(), z.number()]),
});
export type Predicate = z.infer<typeof predicateSchema>;

export const querySchema = z.object({
  where: z.array(predicateSchema).default([]),
  sort: z.object({ field: z.enum(QUERYABLE_FIELDS), dir: z.enum(['asc', 'desc']).default('asc') }).optional(),
  project: z.array(z.enum(QUERYABLE_FIELDS)).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});
export type Query = z.infer<typeof querySchema>;

export const createIndexSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  fields: z.array(z.enum(QUERYABLE_FIELDS)).min(1).max(4),
  kind: z.enum(['btree', 'hash']).default('btree'),
  unique: z.boolean().default(false),
});
export type CreateIndexInput = z.infer<typeof createIndexSchema>;

/** MongoDB-`explain`-style output: how the query ran and how much it cost. */
export interface Explain {
  strategy: 'IXSCAN' | 'COLLSCAN';
  indexUsed: string | null;
  kind: 'btree' | 'hash' | null;
  rowsExamined: number;
  rowsReturned: number;
  /** true if a separate in-memory sort stage ran (the index did NOT provide order) */
  sorted: boolean;
  /** true if the query was answered entirely from the index (docsExamined = 0) */
  covered: boolean;
  tookMs: number;
  planReason: string;
}

export interface IndexInfo {
  name: string;
  fields: string[];
  kind: 'btree' | 'hash';
  unique: boolean;
  entries: number;
}
