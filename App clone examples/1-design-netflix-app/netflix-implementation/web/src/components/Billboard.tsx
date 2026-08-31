'use client';

import { useRouter } from 'next/navigation';
import type { TitleCard } from '../types';
import { useCatalog } from './catalog-context';

export function Billboard({ title }: { title: TitleCard }) {
  const router = useRouter();
  const { open } = useCatalog();
  return (
    <div className="billboard" style={{ backgroundImage: title.poster ? `url(${title.poster})` : undefined }}>
      <div className="info">
        <h1>{title.title}</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-light" onClick={() => router.push(`/watch/${title.imdbID}`)}>▶ Play</button>
          <button className="btn btn-dark" onClick={() => open(title.imdbID)}>ⓘ More Info</button>
        </div>
      </div>
    </div>
  );
}
