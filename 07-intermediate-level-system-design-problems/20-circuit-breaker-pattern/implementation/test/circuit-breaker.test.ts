import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, CircuitOpenError } from '../src/circuit-breaker';

const fail = () => Promise.reject(new Error('downstream'));
const ok = () => Promise.resolve('ok');

test('opens after the failure threshold', async () => {
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000, now: () => 0 });
  for (let i = 0; i < 3; i++) await cb.call(fail).catch(() => {});
  assert.equal(cb.state, 'OPEN');
});

test('fails fast while open (no downstream call)', async () => {
  let now = 0;
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: () => now });
  await cb.call(fail).catch(() => {});
  assert.equal(cb.state, 'OPEN');
  let called = false;
  await assert.rejects(cb.call(async () => { called = true; return 'x'; }), (e) => e instanceof CircuitOpenError);
  assert.equal(called, false, 'downstream not called while open');
});

test('half-open trial success closes the breaker', async () => {
  let now = 0;
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: () => now });
  await cb.call(fail).catch(() => {}); // OPEN, nextAttempt = 1000
  now = 1001; // cooldown elapsed
  const r = await cb.call(ok); // trial → success
  assert.equal(r, 'ok');
  assert.equal(cb.state, 'CLOSED');
});

test('half-open trial failure re-opens the breaker', async () => {
  let now = 0;
  const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000, now: () => now });
  await cb.call(fail).catch(() => {}); // OPEN
  now = 1001;
  await cb.call(fail).catch(() => {}); // trial fails → OPEN again
  assert.equal(cb.state, 'OPEN');
});

test('a success resets the failure count while closed', async () => {
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000, now: () => 0 });
  await cb.call(fail).catch(() => {});
  await cb.call(fail).catch(() => {});
  await cb.call(ok); // resets
  await cb.call(fail).catch(() => {});
  assert.equal(cb.state, 'CLOSED'); // only 1 failure since reset
});
