'use client';

import { AppShell } from '../../components/AppShell';
import { Billboard } from '../../components/Billboard';
import { Row } from '../../components/Row';
import { useBrowseQuery, useGetContinueQuery, useGetMyListQuery } from '../../store/api';
import type { TitleCard } from '../../types';

function BrowseContent() {
  const { data: browse, isLoading } = useBrowseQuery();
  const { data: cont } = useGetContinueQuery();
  const { data: myList } = useGetMyListQuery();

  const continueItems: TitleCard[] = (cont ?? []).map((p) => ({ imdbID: p.imdbID, title: p.title, poster: p.poster, year: '', type: 'movie' }));
  const continueProgress = Object.fromEntries((cont ?? []).map((p) => [p.imdbID, p.percent]));
  const myListItems: TitleCard[] = (myList ?? []).map((m) => ({ imdbID: m.imdbID, title: m.title, poster: m.poster, year: '', type: 'movie' }));

  if (isLoading) return <div className="centered muted">Loading your catalog…</div>;

  if (browse && browse.configured === false) {
    return (
      <div className="container" style={{ padding: '60px 4%' }}>
        <h2>Catalog not configured</h2>
        <p className="muted">
          The server has no <code>OMDB_API_KEY</code>. Get a free key at{' '}
          <a href="https://www.omdbapi.com/apikey.aspx" style={{ textDecoration: 'underline' }}>omdbapi.com</a>, set it in the
          server environment, and restart. Everything else (auth, profiles, My List) still works.
        </p>
      </div>
    );
  }

  return (
    <>
      {browse?.billboard && <Billboard title={browse.billboard} />}
      <div className="container">
        <Row title="Continue Watching" items={continueItems} progress={continueProgress} />
        <Row title="My List" items={myListItems} />
        {(browse?.rows ?? []).map((row) => (
          <Row key={row.key} title={row.title} items={row.items} />
        ))}
      </div>
    </>
  );
}

export default function BrowsePage() {
  return (
    <AppShell>
      <BrowseContent />
    </AppShell>
  );
}
