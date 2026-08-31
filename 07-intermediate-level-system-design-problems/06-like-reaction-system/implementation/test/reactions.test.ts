import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reactionDeltas, isReaction, totalOf, emptyCounts } from '../src/reactions';

test('first reaction increments once', () => {
  assert.deepEqual(reactionDeltas(null, 'like'), { like: 1 });
});

test('removing a reaction decrements once', () => {
  assert.deepEqual(reactionDeltas('like', null), { like: -1 });
});

test('changing reaction decrements old and increments new', () => {
  assert.deepEqual(reactionDeltas('like', 'love'), { like: -1, love: 1 });
});

test('re-sending the same reaction is a no-op (idempotent)', () => {
  assert.deepEqual(reactionDeltas('love', 'love'), {});
  assert.deepEqual(reactionDeltas(null, null), {});
});

test('isReaction validates the enum', () => {
  assert.equal(isReaction('like'), true);
  assert.equal(isReaction('nope'), false);
  assert.equal(isReaction(42), false);
});

test('totalOf sums all reaction counts', () => {
  const c = { ...emptyCounts(), like: 3, love: 2 };
  assert.equal(totalOf(c), 5);
});
