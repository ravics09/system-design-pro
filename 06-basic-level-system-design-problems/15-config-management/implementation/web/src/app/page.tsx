import { Console } from '../components/Console';
import { FlagsPanel, VersionHistory } from '../components/SidePanels';

export default function Page() {
  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Config Management</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 840 }}>
          Configuration resolved from <strong>ordered layers</strong> — defaults → environment file → env vars →
          runtime overrides — with a <strong>source badge</strong> on every key. Values are{' '}
          <strong>validated</strong> (bad overrides are rejected), <strong>secrets are masked</strong>, feature{' '}
          <strong>flags</strong> toggle live, and every change is a <strong>versioned</strong>, reversible entry.
        </p>
      </header>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(420px, 1.6fr) minmax(300px, 1fr)' }}>
        <Console />
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <FlagsPanel />
          <VersionHistory />
        </div>
      </div>
    </main>
  );
}
