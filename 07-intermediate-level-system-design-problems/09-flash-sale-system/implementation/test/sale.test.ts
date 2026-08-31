import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reapable } from '../src/sale';

test('reapable returns only reservations at/before now', () => {
  const now = 1000;
  const ids = reapable(
    [
      { id: 'a', expiresAt: 500 }, // expired
      { id: 'b', expiresAt: 1000 }, // exactly now → expired
      { id: 'c', expiresAt: 1500 }, // still valid
    ],
    now,
  );
  assert.deepEqual(ids.sort(), ['a', 'b']);
});

test('reapable returns nothing when all reservations are in the future', () => {
  assert.deepEqual(reapable([{ id: 'x', expiresAt: 2000 }], 1000), []);
});

test('reapable handles empty input', () => {
  assert.deepEqual(reapable([], 1000), []);
});
