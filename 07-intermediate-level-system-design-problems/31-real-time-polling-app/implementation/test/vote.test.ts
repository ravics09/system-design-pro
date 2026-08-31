import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voteDeltas, totalVotes } from '../src/vote';

test('first vote increments the chosen option', () => {
  assert.deepEqual(voteDeltas(null, 'a'), { a: 1 });
});

test('changing vote decrements old and increments new', () => {
  assert.deepEqual(voteDeltas('a', 'b'), { a: -1, b: 1 });
});

test('re-voting the same option is a no-op (idempotent)', () => {
  assert.deepEqual(voteDeltas('a', 'a'), {});
});

test('totalVotes sums counts (coerces Redis strings)', () => {
  assert.equal(totalVotes({ a: 3, b: '2' }), 5);
  assert.equal(totalVotes({}), 0);
});
