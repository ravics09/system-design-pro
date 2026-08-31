import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHoldable, isConfirmable } from '../src/seats';

const now = 1000;

test('free seat is holdable', () => {
  assert.equal(isHoldable({ status: 'free', heldBy: null, heldUntil: null }, now), true);
});

test('held-but-expired seat is reclaimable', () => {
  assert.equal(isHoldable({ status: 'held', heldBy: 'x', heldUntil: 500 }, now), true);
});

test('held-and-active seat is NOT holdable', () => {
  assert.equal(isHoldable({ status: 'held', heldBy: 'x', heldUntil: 1500 }, now), false);
});

test('booked seat is never holdable', () => {
  assert.equal(isHoldable({ status: 'booked', heldBy: null, heldUntil: null }, now), false);
});

test('confirmable only by the holder before expiry', () => {
  const seat = { status: 'held' as const, heldBy: 'alice', heldUntil: 1500 };
  assert.equal(isConfirmable(seat, 'alice', now), true);
  assert.equal(isConfirmable(seat, 'bob', now), false); // not the holder
  assert.equal(isConfirmable({ ...seat, heldUntil: 500 }, 'alice', now), false); // expired
  assert.equal(isConfirmable({ status: 'free', heldBy: null, heldUntil: null }, 'alice', now), false);
});
