'use client';

import { useRouter } from 'next/navigation';
import {
  useAddToListMutation,
  useGetMyListQuery,
  useGetRatingsQuery,
  useRemoveFromListMutation,
  useRemoveRatingMutation,
  useSetRatingMutation,
  useTitleQuery,
} from '../store/api';

export function TitleModal({ imdbID, onClose }: { imdbID: string; onClose: () => void }) {
  const router = useRouter();
  const { data: title, isLoading, isError } = useTitleQuery(imdbID);
  const { data: myList } = useGetMyListQuery();
  const { data: ratings } = useGetRatingsQuery();
  const [addToList] = useAddToListMutation();
  const [removeFromList] = useRemoveFromListMutation();
  const [setRating] = useSetRatingMutation();
  const [removeRating] = useRemoveRatingMutation();

  const inList = !!myList?.some((m) => m.imdbID === imdbID);
  const rating = ratings?.[imdbID];

  const toggleList = () => {
    if (!title) return;
    if (inList) removeFromList(imdbID);
    else addToList({ imdbID, title: title.title, poster: title.poster });
  };
  const rate = (value: 'up' | 'down') => {
    if (rating === value) removeRating(imdbID);
    else setRating({ imdbID, value });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="hero"
          style={{ backgroundImage: title?.poster ? `url(${title.poster})` : undefined, background: title?.poster ? undefined : '#333' }}
        >
          <button className="close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="body">
          {isLoading && <p className="muted">Loading…</p>}
          {isError && <p className="muted">Could not load this title (is OMDB_API_KEY set on the server?).</p>}
          {title && (
            <>
              <h2 style={{ margin: '0 0 8px' }}>{title.title}</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <button className="btn btn-light" onClick={() => router.push(`/watch/${imdbID}`)}>▶ Play</button>
                <button className="btn btn-dark" onClick={toggleList}>{inList ? '✓ My List' : '+ My List'}</button>
                <button className="btn btn-dark" onClick={() => rate('up')} aria-label="Thumbs up">{rating === 'up' ? '👍🏼' : '👍'}</button>
                <button className="btn btn-dark" onClick={() => rate('down')} aria-label="Thumbs down">{rating === 'down' ? '👎🏼' : '👎'}</button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: '#46d369', fontSize: 14, marginBottom: 10 }}>
                <span>{title.year}</span>
                {title.rated && title.rated !== 'N/A' && <span style={{ color: '#ddd', border: '1px solid #555', padding: '0 6px' }}>{title.rated}</span>}
                {title.runtime && title.runtime !== 'N/A' && <span style={{ color: '#ddd' }}>{title.runtime}</span>}
                {title.imdbRating && title.imdbRating !== 'N/A' && <span>★ {title.imdbRating}</span>}
              </div>
              <p style={{ lineHeight: 1.5 }}>{title.plot}</p>
              <p className="muted" style={{ fontSize: 14 }}><strong>Genre:</strong> {title.genre}</p>
              <p className="muted" style={{ fontSize: 14 }}><strong>Cast:</strong> {title.actors}</p>
              <p className="muted" style={{ fontSize: 14 }}><strong>Director:</strong> {title.director}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
