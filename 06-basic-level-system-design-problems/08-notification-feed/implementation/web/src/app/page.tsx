import { NotificationBell } from "../components/NotificationBell";
import { DemoControls } from "../components/DemoControls";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Real-Time Notifications</h1>
        <NotificationBell />
      </header>
      <p style={{ color: "#666" }}>
        Click a “Simulate” button and watch the bell badge and list update instantly over WebSocket —
        no refresh. Open a second tab to see multi-device delivery.
      </p>
      <DemoControls />
    </main>
  );
}
