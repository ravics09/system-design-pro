import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partitionByExpiry } from '../src/presence';

test('partitions members into online vs expired by lease expiry', () => {
  const now = 1000;
  const { online, expired } = partitionByExpiry(
    [
      { member: 'a', expiresAt: 1500 }, // future → online
      { member: 'b', expiresAt: 999 }, // past → expired
      { member: 'c', expiresAt: 1000 }, // exactly now → expired (not > now)
      { member: 'd', expiresAt: 2000 },
    ],
    now,
  );
  assert.deepEqual(online.sort(), ['a', 'd']);
  assert.deepEqual(expired.sort(), ['b', 'c']);
});

test('empty input yields empty partitions', () => {
  const { online, expired } = partitionByExpiry([], 1000);
  assert.deepEqual(online, []);
  assert.deepEqual(expired, []);
});
