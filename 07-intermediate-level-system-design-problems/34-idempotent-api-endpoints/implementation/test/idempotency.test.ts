import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestFingerprint, decideReplay } from '../src/idempotency';

test('fingerprint is stable for equal bodies and differs for different ones', () => {
  assert.equal(requestFingerprint({ a: 1, b: 2 }), requestFingerprint({ a: 1, b: 2 }));
  assert.notEqual(requestFingerprint({ a: 1 }), requestFingerprint({ a: 2 }));
});

test('completed key with same body → replay stored response', () => {
  assert.equal(decideReplay({ fingerprint: 'f1', status: 'completed' }, 'f1'), 'replay');
});

test('pending key with same body → in progress', () => {
  assert.equal(decideReplay({ fingerprint: 'f1', status: 'pending' }, 'f1'), 'in_progress');
});

test('same key but different body → conflict', () => {
  assert.equal(decideReplay({ fingerprint: 'f1', status: 'completed' }, 'f2'), 'conflict');
  assert.equal(decideReplay({ fingerprint: 'f1', status: 'pending' }, 'f2'), 'conflict');
});
