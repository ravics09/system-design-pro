import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRenditions, canTransition } from '../src/pipeline';

test('planRenditions never upscales and includes the source', () => {
  assert.deepEqual(planRenditions(720), [240, 480, 720]);
  assert.deepEqual(planRenditions(1080), [240, 480, 720, 1080]);
  assert.deepEqual(planRenditions(360), [240, 360]);
});

test('planRenditions dedupes when source equals a ladder rung', () => {
  const r = planRenditions(480);
  assert.deepEqual(r, [240, 480]);
});

test('status transitions enforce the state machine', () => {
  assert.equal(canTransition('queued', 'processing'), true);
  assert.equal(canTransition('processing', 'ready'), true);
  assert.equal(canTransition('processing', 'queued'), true); // requeue after lease expiry
  assert.equal(canTransition('ready', 'processing'), false); // terminal
  assert.equal(canTransition('queued', 'ready'), false); // must process first
});
