'use client';

import type { TitleCard } from '../types';
import { useCatalog } from './catalog-context';
import { Poster } from './Poster';

/** A horizontally-scrolling row of title cards. `progress` optionally shows a resume bar. */
export function Row({
  title,
  items,
  progress,
}: {
  title: string;
  items: TitleCard[];
  progress?: Record<string, number>;
}) {
  const { open } = useCatalog();
  if (items.length === 0) return null;
  return (
    <section className="row">
      <h2>{title}</h2>
      <div className="row-scroll">
        {items.map((item) => (
          <button key={item.imdbID} className="card" onClick={() => open(item.imdbID)} title={item.title}>
            <Poster src={item.poster} title={item.title} />
            {progress && progress[item.imdbID] != null && (
              <div className="progress" style={{ width: `${progress[item.imdbID]}%` }} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
