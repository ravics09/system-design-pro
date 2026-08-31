import { IndexManager } from '../components/IndexManager';
import { QueryConsole } from '../components/QueryConsole';

export default function Page() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Database Indexing</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 820 }}>
          Run a query against an in-memory collection and read its <strong>EXPLAIN</strong>. With no index the
          planner does a <strong>full scan (COLLSCAN)</strong> examining every row; add a matching{' '}
          <strong>b-tree / hash / compound</strong> index and the same query becomes an{' '}
          <strong>index scan (IXSCAN)</strong> that examines far fewer rows. Watch the{' '}
          <strong>examined : returned</strong> ratio — the closer to 1:1, the better the index.
        </p>
      </header>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(340px, 1fr) minmax(360px, 1.1fr)' }}>
        <IndexManager />
        <QueryConsole />
      </div>
    </main>
  );
}
