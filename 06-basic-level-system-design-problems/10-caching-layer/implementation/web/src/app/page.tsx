import { ItemsPanel } from "../components/ItemsPanel";
import { StatsPanel } from "../components/StatsPanel";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Caching Layer</h1>
      <p style={{ color: "#666" }}>
        Watch cache-aside in action: the miss/hit badge shows the latency difference, and the stats
        panel tracks the hit ratio live.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
        <ItemsPanel />
        <StatsPanel />
      </div>
    </main>
  );
}
