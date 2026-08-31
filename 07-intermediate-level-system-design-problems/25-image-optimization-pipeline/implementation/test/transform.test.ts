import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTransform, cacheKey } from '../src/transform';

const allowed = [100, 200, 400, 800];

test('parseTransform clamps width to the whitelist (anti cache-buster)', () => {
  assert.equal(parseTransform({ w: 200 }, allowed).width, 200);
  assert.equal(parseTransform({ w: 12345 }, allowed).width, 100); // not allowed → first allowed
  assert.equal(parseTransform({ w: 'abc' }, allowed).width, 100);
});

test('parseTransform validates format and quality', () => {
  assert.equal(parseTransform({ format: 'avif' }, allowed).format, 'avif');
  assert.equal(parseTransform({ format: 'gif' }, allowed).format, 'webp'); // default
  assert.equal(parseTransform({ q: 50 }, allowed).quality, 50);
  assert.equal(parseTransform({ q: 999 }, allowed).quality, 80); // out of range → default
});

test('cacheKey is deterministic for identical params', () => {
  const t = parseTransform({ w: 400, format: 'webp', q: 80 }, allowed);
  assert.equal(cacheKey('img1', t), cacheKey('img1', t));
});

test('cacheKey differs when any param changes', () => {
  const a = cacheKey('img1', parseTransform({ w: 400, format: 'webp' }, allowed));
  const b = cacheKey('img1', parseTransform({ w: 800, format: 'webp' }, allowed));
  const c = cacheKey('img1', parseTransform({ w: 400, format: 'avif' }, allowed));
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  assert.ok(a.endsWith('.webp') && c.endsWith('.avif'));
});
