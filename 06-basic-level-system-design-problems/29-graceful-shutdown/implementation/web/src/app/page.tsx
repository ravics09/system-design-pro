import { Dashboard } from '../components/Dashboard';

export default function Page() {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Graceful Shutdown</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 820 }}>
          When the platform sends <strong>SIGTERM</strong>, the server stops accepting new requests, keeps liveness
          green while failing readiness (so the load balancer de-registers it), <strong>drains in-flight
          requests</strong>, then exits — the basis of <strong>zero-downtime deploys</strong>. Trigger a shutdown while a
          slow request is running and watch the phases.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
