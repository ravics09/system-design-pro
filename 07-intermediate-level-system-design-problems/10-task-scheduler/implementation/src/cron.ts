/**
 * Minimal 5-field cron ("min hour day-of-month month day-of-week") supporting `*`, ranges
 * (`a-b`), steps (`*​/n`, `a-b/n`), and lists (`a,b,c`). Enough to compute the next fire time
 * for common schedules; production would use a battle-tested cron parser.
 */
function parseField(field: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  for (const part of field.split(',')) {
    const [range, stepStr] = part.split('/');
    const step = stepStr ? Number(stepStr) : 1;
    let lo = min;
    let hi = max;
    if (range !== '*') {
      const [a, b] = range.split('-');
      lo = Number(a);
      hi = b !== undefined ? Number(b) : Number(a);
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export interface Cron {
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
}

export function parseCron(expr: string): Cron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('cron must have 5 fields');
  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dom: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dow: parseField(parts[4], 0, 6), // 0 = Sunday
  };
}

function matches(c: Cron, d: Date): boolean {
  return (
    c.minute.has(d.getUTCMinutes()) &&
    c.hour.has(d.getUTCHours()) &&
    c.dom.has(d.getUTCDate()) &&
    c.month.has(d.getUTCMonth() + 1) &&
    c.dow.has(d.getUTCDay())
  );
}

/** Next fire time strictly after `from` (UTC), scanning minute-by-minute (bounded ~366 days). */
export function nextCronTime(expr: string, from: number): number {
  const cron = parseCron(expr);
  const d = new Date(from);
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1); // strictly after
  const limit = from + 366 * 24 * 3600 * 1000;
  while (d.getTime() <= limit) {
    if (matches(cron, d)) return d.getTime();
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  throw new Error('no cron match within a year');
}

export type Schedule =
  | { type: 'once'; at: number }
  | { type: 'interval'; everyMs: number }
  | { type: 'cron'; expr: string };

/** Next run time for any schedule type, or null when a one-off has already fired. */
export function nextRun(schedule: Schedule, from: number): number | null {
  switch (schedule.type) {
    case 'once':
      return schedule.at > from ? schedule.at : null;
    case 'interval':
      return from + schedule.everyMs;
    case 'cron':
      return nextCronTime(schedule.expr, from);
  }
}
