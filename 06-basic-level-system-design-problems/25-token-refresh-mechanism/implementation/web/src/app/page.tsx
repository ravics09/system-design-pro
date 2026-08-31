import { AuthConsole } from '../components/AuthConsole';
import { SessionsTable } from '../components/SessionsTable';

export default function Page() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Token Refresh Mechanism</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 820 }}>
          Log in to get a short-lived <strong>access token</strong> (watch it count down) and a long-lived{' '}
          <strong>refresh token</strong>. Refreshing <strong>rotates</strong> the refresh token; replaying the old
          (used) one triggers <strong>reuse detection</strong>, which <strong>revokes the whole token family</strong> —
          watch the lineage table light up red.
        </p>
      </header>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(340px, 1fr) minmax(360px, 1.1fr)' }}>
        <AuthConsole />
        <SessionsTable />
      </div>
    </main>
  );
}
