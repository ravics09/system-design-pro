import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTag, normalizeTags, buildTagQuery } from '../src/tags';

test('normalizeTag collapses case, separators, and symbols', () => {
  assert.equal(normalizeTag('  NodeJS '), 'nodejs');
  assert.equal(normalizeTag('node.js'), 'node-js');
  assert.equal(normalizeTag('C++ Lang!'), 'c-lang');
  assert.equal(normalizeTag('a__b  c'), 'a-b-c');
});

test('normalizeTags dedupes and drops empties', () => {
  assert.deepEqual(normalizeTags(['Node.js', 'node-js', '', '  ']), ['node-js']);
  assert.deepEqual(normalizeTags('not an array' as unknown), []);
});

test('buildTagQuery uses $all for AND and $in for OR', () => {
  assert.deepEqual(buildTagQuery(['a', 'b'], 'all'), { tags: { $all: ['a', 'b'] } });
  assert.deepEqual(buildTagQuery(['a', 'b'], 'any'), { tags: { $in: ['a', 'b'] } });
});

test('buildTagQuery adds a keyset cursor predicate', () => {
  assert.deepEqual(buildTagQuery(['a'], 'all', 'cursor123'), {
    tags: { $all: ['a'] },
    _id: { $lt: 'cursor123' },
  });
});

test('buildTagQuery with no tags returns an empty (all-posts) filter', () => {
  assert.deepEqual(buildTagQuery([], 'all'), {});
});
