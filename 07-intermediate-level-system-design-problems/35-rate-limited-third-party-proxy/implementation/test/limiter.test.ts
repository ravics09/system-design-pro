import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refillAndConsume, cacheKey } from '../src/limiter';

test('consumes a token when available', () => {
  const r = refillAndConsume(5, 1000, 1000, 2, 10);
  assert.equal(r.allowed, true);
  assert.equal(r.tokens, 4);
});

test('denies when empty and not yet refilled', () => {
  const r = refillAndConsume(0, 1000, 1000, 2, 10);
  assert.equal(r.allowed, false);
  assert.equal(r.tokens, 0);
});

test('refills over elapsed time up to capacity', () => {
  // 0 tokens, 2/sec, 1s later → 2 tokens, consume 1 → allowed, 1 left
  const r = refillAndConsume(0, 1000, 2000, 2, 10);
  assert.equal(r.allowed, true);
  assert.equal(r.tokens, 1);
});

test('never refills beyond capacity', () => {
  const r = refillAndConsume(10, 1000, 100000, 2, 10);
  assert.equal(r.tokens, 9); // capped at 10 then consumed 1
});

test('cacheKey is order-independent on query params', () => {
  assert.equal(cacheKey('weather', { b: 2, a: 1 }), cacheKey('weather', { a: 1, b: 2 }));
  assert.notEqual(cacheKey('weather', { a: 1 }), cacheKey('news', { a: 1 }));
});
