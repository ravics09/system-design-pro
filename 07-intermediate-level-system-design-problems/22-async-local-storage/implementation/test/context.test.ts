import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runWithContext, getContext, log } from '../src/context';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('context is readable deep in an async chain', async () => {
  await runWithContext({ traceId: 't1', userId: 'u1' }, async () => {
    await tick(5);
    await tick(5);
    assert.equal(getContext()?.traceId, 't1');
    assert.equal(getContext()?.userId, 'u1');
  });
});

test('concurrent requests do NOT leak context into each other', async () => {
  // This is the core correctness property a shared global would violate.
  const results: Record<string, string> = {};
  await Promise.all([
    runWithContext({ traceId: 'A', userId: 'ua' }, async () => {
      await tick(10); // yields — request B interleaves here
      results.A = getContext()!.traceId;
    }),
    runWithContext({ traceId: 'B', userId: 'ub' }, async () => {
      await tick(5);
      results.B = getContext()!.traceId;
    }),
  ]);
  assert.equal(results.A, 'A');
  assert.equal(results.B, 'B');
});

test('getContext is undefined outside a run', () => {
  assert.equal(getContext(), undefined);
});

test('log auto-attaches the current traceId', async () => {
  await runWithContext({ traceId: 'trace-9', userId: null }, async () => {
    const line = log('hello', { extra: 1 });
    assert.equal(line.traceId, 'trace-9');
    assert.equal(line.message, 'hello');
    assert.equal(line.extra, 1);
  });
});
