import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, encodeCursor, decodeCursor, buildMatch } from '../src/search';

test('tokenize lowercases, splits, and dedupes', () => {
  assert.deepEqual(tokenize('Node.js Redis node'), ['node', 'js', 'redis']);
  assert.deepEqual(tokenize(''), []);
});

test('cursor round-trips a valid ObjectId', () => {
  const id = 'abcdefabcdefabcdefabcdef';
  assert.equal(decodeCursor(encodeCursor(id)), id);
});

test('decodeCursor rejects garbage / non-ObjectId', () => {
  assert.equal(decodeCursor('not-base64!!'), null);
  assert.equal(decodeCursor(encodeCursor('short')), null);
  assert.equal(decodeCursor(null), null);
});

test('buildMatch uses $all for tokens and adds the keyset predicate', () => {
  assert.deepEqual(buildMatch(['a', 'b'], null), { tokens: { $all: ['a', 'b'] } });
  assert.deepEqual(buildMatch(['a'], 'cid'), { tokens: { $all: ['a'] }, _id: { $lt: 'cid' } });
  assert.deepEqual(buildMatch([], null), {});
});
