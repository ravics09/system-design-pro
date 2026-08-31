import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLog, redactSecrets } from '../src/logs';

test('redactSecrets masks sensitive keys, keeps others', () => {
  const out = redactSecrets({ password: 'hunter2', token: 'abc', userId: 'u1', count: 3 });
  assert.equal(out.password, '[REDACTED]');
  assert.equal(out.token, '[REDACTED]');
  assert.equal(out.userId, 'u1');
  assert.equal(out.count, 3);
});

test('normalizeLog applies defaults and separates known fields from extras', () => {
  const e = normalizeLog({ service: 'orders', message: 'hi', orderId: 'o1', apiKey: 'x' });
  assert.equal(e.level, 'info'); // default
  assert.equal(e.service, 'orders');
  assert.equal(e.message, 'hi');
  assert.equal(e.traceId, null);
  assert.equal(e.fields.orderId, 'o1');
  assert.equal(e.fields.apiKey, '[REDACTED]'); // redacted extra
  assert.ok(e.ts instanceof Date);
});

test('normalizeLog coerces an invalid level to info', () => {
  assert.equal(normalizeLog({ level: 'verbose', message: 'x' }).level, 'info');
  assert.equal(normalizeLog({ level: 'error', message: 'x' }).level, 'error');
});

test('normalizeLog keeps a provided traceId for correlation', () => {
  assert.equal(normalizeLog({ traceId: 'trace-1', message: 'x' }).traceId, 'trace-1');
});
