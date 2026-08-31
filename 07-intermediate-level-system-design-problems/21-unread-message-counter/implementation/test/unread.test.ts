import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumCounts, clampNonNegative } from '../src/unread';

test('sumCounts totals per-conversation unread', () => {
  assert.equal(sumCounts({ c1: 3, c2: 5, c3: 0 }), 8);
  assert.equal(sumCounts({}), 0);
});

test('sumCounts coerces Redis string values and ignores negatives', () => {
  assert.equal(sumCounts({ c1: '4', c2: '2' }), 6);
  assert.equal(sumCounts({ c1: -1 as unknown as number, c2: 3 }), 3);
});

test('clampNonNegative floors at zero', () => {
  assert.equal(clampNonNegative(-2), 0);
  assert.equal(clampNonNegative(0), 0);
  assert.equal(clampNonNegative(7), 7);
});
