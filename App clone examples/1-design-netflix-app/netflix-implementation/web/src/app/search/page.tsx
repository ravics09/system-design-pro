'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Poster } from '../../components/Poster';
import { useCatalog } from '../../components/catalog-context';
import { useSearchQuery } from '../../store/api';

function SearchContent() {
  const { open } = useCatalog();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const { data: results, isFetching } = useSearchQuery(debounced, { skip: debounced.length < 2 });

  return (
    <div className="container" style={{ padding: '24px 0' }}>
      <input
        className="input"
        style={{ maxWidth: 520 }}
        placeholder="Search movies…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        autoFocus
      />
      {debounced.length >= 2 && isFetching && <p className="muted">Searching…</p>}
      {debounced.length >= 2 && !isFetching && (results?.length ?? 0) === 0 && (
        <p className="muted">No results for “{debounced}”.</p>
      )}
      <div className="grid">
        {(results ?? []).map((r) => (
          <button key={r.imdbID} className="card" onClick={() => open(r.imdbID)} title={r.title}>
            <Poster src={r.poster} title={r.title} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell>
      <SearchContent />
    </AppShell>
  );
}
