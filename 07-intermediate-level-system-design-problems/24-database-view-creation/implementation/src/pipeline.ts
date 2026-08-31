export const VIEW_COLLECTION = 'rpt_daily_revenue';

export interface OrderLike {
  day: string; // YYYY-MM-DD
  region: string;
  totalCents: number;
  status: string;
}

/**
 * The aggregation pipeline that materializes "daily revenue by region". The final `$merge`
 * upserts results into a real collection so dashboards read precomputed rows instantly.
 * Returned as data so it's inspectable/testable.
 */
export function buildDailyRevenuePipeline(): Record<string, unknown>[] {
  return [
    { $match: { status: 'paid' } },
    {
      $group: {
        _id: { day: '$day', region: '$region' },
        revenueCents: { $sum: '$totalCents' },
        orders: { $sum: 1 },
      },
    },
    { $merge: { into: VIEW_COLLECTION, on: '_id', whenMatched: 'replace', whenNotMatched: 'insert' } },
  ];
}

/** Pure JS equivalent of the pipeline — lets us unit-test the aggregation logic without Mongo. */
export function aggregateDailyRevenue(orders: OrderLike[]): { day: string; region: string; revenueCents: number; orders: number }[] {
  const map = new Map<string, { day: string; region: string; revenueCents: number; orders: number }>();
  for (const o of orders) {
    if (o.status !== 'paid') continue; // only paid orders count
    const key = `${o.day}|${o.region}`;
    const cur = map.get(key) ?? { day: o.day, region: o.region, revenueCents: 0, orders: 0 };
    cur.revenueCents += o.totalCents;
    cur.orders += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => (a.day + a.region).localeCompare(b.day + b.region));
}
