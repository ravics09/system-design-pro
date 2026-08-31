import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tracker, coalesce } from '../src/tracker';

test('update bumps a monotonic version', () => {
  const t = new Tracker();
  const v0 = t.current().version;
  const a = t.update();
  const b = t.update();
  assert.equal(a.version, v0 + 1);
  assert.equal(b.version, v0 + 2);
});

test('since returns state only when newer (long-poll semantics)', () => {
  const t = new Tracker();
  t.update(); // version 1
  assert.equal(t.since(1), null); // caller already has v1
  assert.ok(t.since(0), 'v0 caller gets v1');
  t.update(); // version 2
  assert.equal(t.since(1)?.version, 2);
});

test('update emits an event for push subscribers (SSE/WS)', () => {
  const t = new Tracker();
  let got = 0;
  t.on('update', () => (got += 1));
  t.update();
  t.update();
  assert.equal(got, 2);
});

test('coalesce keeps only the latest of a burst', () => {
  const mk = (version: number) => ({ version, lat: 0, lng: 0, at: version });
  assert.equal(coalesce([mk(1), mk(3), mk(2)])?.version, 3);
  assert.equal(coalesce([]), null);
});
