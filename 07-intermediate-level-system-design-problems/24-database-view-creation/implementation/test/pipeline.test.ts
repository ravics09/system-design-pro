import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyRevenuePipeline, aggregateDailyRevenue, VIEW_COLLECTION } from '../src/pipeline';

test('pipeline ends with a $merge into the report collection', () => {
  const p = buildDailyRevenuePipeline();
  const merge = p[p.length - 1] as { $merge: { into: string } };
  assert.equal(merge.$merge.into, VIEW_COLLECTION);
  assert.ok((p[0] as { $match: unknown }).$match, 'starts with a $match');
  assert.ok((p[1] as { $group: unknown }).$group, 'groups by day+region');
});

test('aggregateDailyRevenue sums paid orders by day+region', () => {
  const rows = aggregateDailyRevenue([
    { day: '2026-01-01', region: 'us', totalCents: 1000, status: 'paid' },
    { day: '2026-01-01', region: 'us', totalCents: 500, status: 'paid' },
    { day: '2026-01-01', region: 'eu', totalCents: 2000, status: 'paid' },
    { day: '2026-01-02', region: 'us', totalCents: 999, status: 'paid' },
  ]);
  const us1 = rows.find((r) => r.day === '2026-01-01' && r.region === 'us')!;
  assert.equal(us1.revenueCents, 1500);
  assert.equal(us1.orders, 2);
  assert.equal(rows.length, 3);
});

test('aggregateDailyRevenue ignores non-paid orders', () => {
  const rows = aggregateDailyRevenue([
    { day: '2026-01-01', region: 'us', totalCents: 1000, status: 'pending' },
    { day: '2026-01-01', region: 'us', totalCents: 500, status: 'paid' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].revenueCents, 500);
});
