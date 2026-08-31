import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productKey, categoryVersionKey, categoryListKey } from '../src/keys';

test('productKey is deterministic per id', () => {
  assert.equal(productKey('42'), 'product:42');
});

test('categoryListKey embeds the version so a bump invalidates the group', () => {
  assert.equal(categoryListKey('books', 1), 'cat:books:v1:products');
  assert.notEqual(categoryListKey('books', 1), categoryListKey('books', 2));
});

test('categoryVersionKey is separate from list keys', () => {
  assert.equal(categoryVersionKey('books'), 'catver:books');
});
