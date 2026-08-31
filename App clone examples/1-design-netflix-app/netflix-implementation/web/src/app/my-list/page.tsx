'use client';

import { AppShell } from '../../components/AppShell';
import { Poster } from '../../components/Poster';
import { useCatalog } from '../../components/catalog-context';
import { useGetMyListQuery } from '../../store/api';

function MyListContent() {
  const { open } = useCatalog();
  const { data: list, isLoading } = useGetMyListQuery();

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <h1 style={{ fontSize: '1.6rem' }}>My List</h1>
      {isLoading && <p className="muted">Loading…</p>}
      {!isLoading && (list?.length ?? 0) === 0 && <p className="muted">Your list is empty. Add titles from any detail view.</p>}
      <div className="grid">
        {(list ?? []).map((m) => (
          <button key={m.imdbID} className="card" onClick={() => open(m.imdbID)} title={m.title}>
            <Poster src={m.poster} title={m.title} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MyListPage() {
  return (
    <AppShell>
      <MyListContent />
    </AppShell>
  );
}
