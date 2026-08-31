import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Snowflake, decode, EPOCH } from '../src/snowflake';

test('rejects out-of-range machine ids', () => {
  assert.throws(() => new Snowflake(-1));
  assert.throws(() => new Snowflake(1024));
  assert.doesNotThrow(() => new Snowflake(1023));
});

test('ids are unique and monotonically increasing', () => {
  const gen = new Snowflake(7);
  const ids: bigint[] = [];
  for (let i = 0; i < 5000; i++) ids.push(gen.nextId());
  assert.equal(new Set(ids.map(String)).size, 5000, 'all unique');
  for (let i = 1; i < ids.length; i++) assert.ok(ids[i] > ids[i - 1], 'monotonic');
});

test('decode recovers timestamp, machine id, and sequence', () => {
  const ms = 1_700_000_000_000;
  let t = ms;
  const gen = new Snowflake(42, () => t);
  const a = gen.nextId();
  const b = gen.nextId(); // same ms → sequence increments
  assert.equal(decode(a).machineId, 42);
  assert.equal(decode(a).timestampMs, ms);
  assert.equal(decode(a).sequence, 0);
  assert.equal(decode(b).sequence, 1);
});

test('sequence rollover waits for the next millisecond', () => {
  let t = 1_700_000_000_000;
  let advanced = false;
  const gen = new Snowflake(1, () => {
    // Freeze the clock until the generator busy-waits, then advance once.
    if (advanced) return t + 1;
    return t;
  });
  // Exhaust the 4096-sequence in one ms; the 4097th must roll to the next ms.
  for (let i = 0; i < 4096; i++) gen.nextId();
  advanced = true;
  const rolled = gen.nextId();
  assert.equal(decode(rolled).timestampMs, t + 1);
  assert.equal(decode(rolled).sequence, 0);
});

test('clock moving backwards throws (no duplicate risk)', () => {
  let t = 1_700_000_000_000;
  const gen = new Snowflake(1, () => t);
  gen.nextId();
  t -= 5; // NTP step backwards
  assert.throws(() => gen.nextId(), /backwards/);
});

test('epoch is 2020-01-01', () => {
  assert.equal(new Date(Number(EPOCH)).toISOString(), '2020-01-01T00:00:00.000Z');
});
