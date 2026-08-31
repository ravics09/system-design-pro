import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retryOnConflict, isVersionConflict, ConflictError } from '../src/retry';

const noSleep = async () => {};

test('isVersionConflict recognizes VersionError and dup-key', () => {
  assert.equal(isVersionConflict({ name: 'VersionError' }), true);
  assert.equal(isVersionConflict({ code: 11000 }), true);
  assert.equal(isVersionConflict(new Error('other')), false);
});

test('retries on version conflict then succeeds', async () => {
  let calls = 0;
  const result = await retryOnConflict(async () => {
    calls++;
    if (calls < 3) throw { name: 'VersionError' };
    return 'ok';
  }, 5, noSleep);
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('gives up after max attempts with a ConflictError', async () => {
  let calls = 0;
  await assert.rejects(
    retryOnConflict(async () => { calls++; throw { name: 'VersionError' }; }, 3, noSleep),
    (e) => e instanceof ConflictError,
  );
  assert.equal(calls, 3);
});

test('does NOT retry non-conflict errors', async () => {
  let calls = 0;
  await assert.rejects(
    retryOnConflict(async () => { calls++; throw new Error('boom'); }, 5, noSleep),
    /boom/,
  );
  assert.equal(calls, 1);
});
