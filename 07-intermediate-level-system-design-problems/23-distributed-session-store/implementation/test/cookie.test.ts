import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCookieOptions } from '../src/cookie';

test('production forces Secure cookies', () => {
  const c = buildCookieOptions('production', 1800);
  assert.equal(c.secure, true);
  assert.equal(c.httpOnly, true);
  assert.equal(c.sameSite, 'lax');
  assert.equal(c.maxAge, 1800 * 1000);
});

test('development does not require Secure (works over http)', () => {
  assert.equal(buildCookieOptions('development', 60).secure, false);
});

test('HttpOnly is always set (mitigates XSS token theft)', () => {
  assert.equal(buildCookieOptions('development', 60).httpOnly, true);
  assert.equal(buildCookieOptions('production', 60).httpOnly, true);
});
