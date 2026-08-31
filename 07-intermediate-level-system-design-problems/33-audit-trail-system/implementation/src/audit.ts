import { createHash } from 'node:crypto';

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/** Field-level before/after diff over two flat objects (ignores internal keys). Pure. */
export function computeDiff(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const field of keys) {
    if (field === '_id' || field === '__v') continue;
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      changes.push({ field, from: before[field], to: after[field] });
    }
  }
  return changes;
}

export interface AuditCore {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  changes: FieldChange[];
  at: string; // ISO
}

/** Hash of a record chained to the previous one → tamper-evident append-only log. Pure. */
export function hashRecord(prevHash: string, core: AuditCore): string {
  return createHash('sha256').update(prevHash + JSON.stringify(core)).digest('hex');
}

/** Verify a chain: each record's hash must equal hashRecord(prevHash, core). Pure. */
export function verifyChain(records: (AuditCore & { prevHash: string; hash: string })[]): boolean {
  let prev = 'GENESIS';
  for (const r of records) {
    const { prevHash, hash, ...core } = r;
    if (prevHash !== prev) return false;
    if (hashRecord(prevHash, core) !== hash) return false;
    prev = hash;
  }
  return true;
}

export const GENESIS = 'GENESIS';
