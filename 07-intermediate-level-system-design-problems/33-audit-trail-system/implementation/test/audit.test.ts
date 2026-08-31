import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDiff, hashRecord, verifyChain, GENESIS, type AuditCore } from '../src/audit';

test('computeDiff reports changed fields only, ignoring _id/__v', () => {
  const d = computeDiff({ _id: 'x', __v: 0, amount: 100, status: 'draft' }, { _id: 'x', __v: 1, amount: 120, status: 'draft' });
  assert.deepEqual(d, [{ field: 'amount', from: 100, to: 120 }]);
});

test('computeDiff detects added and removed fields', () => {
  const d = computeDiff({ a: 1 }, { a: 1, b: 2 });
  assert.deepEqual(d, [{ field: 'b', from: undefined, to: 2 }]);
});

function core(i: number): AuditCore {
  return { entityType: 'invoice', entityId: '1', action: 'update', actor: 'u', changes: [{ field: 'x', from: i - 1, to: i }], at: `t${i}` };
}

test('a well-formed hash chain verifies', () => {
  const records: (AuditCore & { prevHash: string; hash: string })[] = [];
  let prev = GENESIS;
  for (let i = 1; i <= 3; i++) {
    const c = core(i);
    const hash = hashRecord(prev, c);
    records.push({ ...c, prevHash: prev, hash });
    prev = hash;
  }
  assert.equal(verifyChain(records), true);
});

test('tampering with a record breaks the chain', () => {
  const records: (AuditCore & { prevHash: string; hash: string })[] = [];
  let prev = GENESIS;
  for (let i = 1; i <= 3; i++) {
    const c = core(i);
    const hash = hashRecord(prev, c);
    records.push({ ...c, prevHash: prev, hash });
    prev = hash;
  }
  records[1].changes[0].to = 999; // tamper with history
  assert.equal(verifyChain(records), false);
});
