import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compositeScore, rawScoreFromComposite } from '../src/leaderboard';

test('higher score always outranks lower score', () => {
  const a = compositeScore(100, 1_700_000_000_000);
  const b = compositeScore(99, 1_600_000_000_000); // older but lower score
  assert.ok(a > b);
});

test('equal scores: earlier achiever ranks higher', () => {
  const early = compositeScore(100, 1_700_000_000_000);
  const late = compositeScore(100, 1_700_000_005_000);
  assert.ok(early > late, 'earlier timestamp yields a higher composite');
});

test('composite decodes back to the raw score', () => {
  assert.equal(rawScoreFromComposite(compositeScore(4242, 1_700_000_000_000)), 4242);
  assert.equal(rawScoreFromComposite(compositeScore(0, 1_700_000_000_000)), 0);
});

test('composite stays within safe integer range for reasonable scores', () => {
  assert.ok(compositeScore(99_999, Date.now()) < Number.MAX_SAFE_INTEGER);
});
