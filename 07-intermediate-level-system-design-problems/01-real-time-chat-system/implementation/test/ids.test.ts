import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextMessageId } from '../src/lib/ids';
import { signToken, verifyToken } from '../src/lib/token';

test('message ids are unique and monotonic within the same millisecond', () => {
  const now = 1_700_000_000_000;
  const a = nextMessageId(now);
  const b = nextMessageId(now);
  const c = nextMessageId(now);
  assert.notEqual(a, b);
  assert.notEqual(b, c);
  assert.ok(a < b && b < c, 'ids sort in creation order');
});

test('message ids are lexicographically time-ordered across milliseconds', () => {
  const earlier = nextMessageId(1_700_000_000_000);
  const later = nextMessageId(1_700_000_000_001);
  assert.ok(earlier < later);
});

test('token round-trips and rejects tampering', () => {
  const t = signToken('alice');
  assert.equal(verifyToken(t), 'alice');
  assert.equal(verifyToken(t + 'x'), null);
  assert.equal(verifyToken('garbage'), null);
});
