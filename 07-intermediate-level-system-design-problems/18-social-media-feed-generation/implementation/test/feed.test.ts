import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldFanout, mergeTimelines, makePostId } from '../src/feed';

test('shouldFanout: push for normal authors, skip for celebrities', () => {
  assert.equal(shouldFanout(500, 1000), true);
  assert.equal(shouldFanout(1000, 1000), true); // at threshold still push
  assert.equal(shouldFanout(1001, 1000), false); // celebrity → pull
});

test('mergeTimelines merges, dedupes, and sorts newest-first', () => {
  const a = ['0000000000300-00000', '0000000000100-00000'];
  const b = ['0000000000300-00000', '0000000000200-00000'];
  assert.deepEqual(mergeTimelines([a, b], 10), [
    '0000000000300-00000',
    '0000000000200-00000',
    '0000000000100-00000',
  ]);
});

test('mergeTimelines respects the limit', () => {
  assert.equal(mergeTimelines([['3', '2', '1']], 2).length, 2);
});

test('makePostId is unique and time-monotonic', () => {
  const a = makePostId(1000);
  const b = makePostId(1000);
  const c = makePostId(1001);
  assert.ok(a < b && b < c);
});
