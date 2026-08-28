"use client";

import { useGetStatsQuery, useFlushMutation, useSeedMutation } from "../store/cacheApi";

/** Live cache metrics — hit ratio is the number that matters. Polls every 1s. */
export function StatsPanel() {
  const { data: stats } = useGetStatsQuery(undefined, { pollingInterval: 1000 });
  const [flush, { isLoading: flushing }] = useFlushMutation();
  const [seed] = useSeedMutation();

  const pct = stats ? Math.round(stats.hitRatio * 100) : 0;

  return (
    <aside style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Cache Stats</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
        <Metric label="Hit ratio" value={`${pct}%`} highlight />
        <Metric label="Size" value={String(stats?.size ?? 0)} />
        <Metric label="Hits" value={String(stats?.hits ?? 0)} />
        <Metric label="Misses" value={String(stats?.misses ?? 0)} />
        <Metric label="Sets" value={String(stats?.sets ?? 0)} />
        <Metric label="Evictions" value={String(stats?.evictions ?? 0)} />
      </div>

      <div style={{ height: 8, background: "#eee", borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#2e7d32" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => flush()} disabled={flushing}>Flush cache</button>
        <button onClick={() => seed()}>Reset origin</button>
      </div>
    </aside>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? "#f0f7ff" : "#fafafa", borderRadius: 6, padding: 8 }}>
      <div style={{ color: "#666", fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: highlight ? 20 : 16 }}>{value}</div>
    </div>
  );
}
