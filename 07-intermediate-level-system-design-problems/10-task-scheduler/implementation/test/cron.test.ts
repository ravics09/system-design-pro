import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextCronTime, parseCron, nextRun } from '../src/cron';

const BASE = Date.UTC(2020, 0, 1, 0, 0, 0); // 2020-01-01T00:00:00Z

test('every-minute cron fires at the next minute', () => {
  assert.equal(nextCronTime('* * * * *', BASE), BASE + 60_000);
});

test('step cron */15 fires at the next quarter hour', () => {
  assert.equal(nextCronTime('*/15 * * * *', BASE), BASE + 15 * 60_000);
});

test('daily 09:30 cron fires at the next 09:30 UTC', () => {
  const expected = Date.UTC(2020, 0, 1, 9, 30, 0);
  assert.equal(nextCronTime('30 9 * * *', BASE), expected);
});

test('parseCron expands ranges and lists', () => {
  const c = parseCron('0 9-11 * * 1,3');
  assert.deepEqual([...c.hour].sort((a, b) => a - b), [9, 10, 11]);
  assert.deepEqual([...c.dow].sort((a, b) => a - b), [1, 3]);
});

test('nextRun handles once/interval/cron', () => {
  assert.equal(nextRun({ type: 'once', at: BASE + 5000 }, BASE), BASE + 5000);
  assert.equal(nextRun({ type: 'once', at: BASE - 5000 }, BASE), null); // already past
  assert.equal(nextRun({ type: 'interval', everyMs: 1000 }, BASE), BASE + 1000);
  assert.equal(nextRun({ type: 'cron', expr: '* * * * *' }, BASE), BASE + 60_000);
});

test('invalid cron throws', () => {
  assert.throws(() => parseCron('* * *'));
});
