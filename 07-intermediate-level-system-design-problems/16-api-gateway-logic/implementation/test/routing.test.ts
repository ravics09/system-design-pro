import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute, rewritePath, TokenBucket, RateLimiter } from '../src/routing';

const routes = [
  { prefix: '/users', target: 'http://u' },
  { prefix: '/orders', target: 'http://o', auth: true },
];

test('matchRoute picks the matching prefix', () => {
  assert.equal(matchRoute(routes, '/users/42')?.target, 'http://u');
  assert.equal(matchRoute(routes, '/orders')?.target, 'http://o');
  assert.equal(matchRoute(routes, '/nope'), null);
});

test('rewritePath strips the matched prefix', () => {
  assert.equal(rewritePath('/users', '/users/42'), '/42');
  assert.equal(rewritePath('/users', '/users'), '/');
});

test('token bucket allows up to capacity then limits', () => {
  const b = new TokenBucket(3, 0, 1000); // no refill
  assert.equal(b.tryRemove(1000), true);
  assert.equal(b.tryRemove(1000), true);
  assert.equal(b.tryRemove(1000), true);
  assert.equal(b.tryRemove(1000), false); // exhausted
});

test('token bucket refills over time', () => {
  const b = new TokenBucket(2, 10, 1000); // 10 tokens/sec
  b.tryRemove(1000);
  b.tryRemove(1000);
  assert.equal(b.tryRemove(1000), false);
  assert.equal(b.tryRemove(1200), true); // 200ms → 2 tokens refilled
});

test('rate limiter isolates buckets per key', () => {
  const rl = new RateLimiter(1, 0);
  assert.equal(rl.allow('ip1', 1000), true);
  assert.equal(rl.allow('ip1', 1000), false);
  assert.equal(rl.allow('ip2', 1000), true); // separate bucket
});
