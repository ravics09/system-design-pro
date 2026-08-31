'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecordProgressMutation, useTitleQuery } from '../../../store/api';
import { useAppSelector } from '../../../store/hooks';

// OMDb serves metadata only (no video), so playback is a mock stream — the design point:
// the control plane returns metadata; a real player would stream from a CDN.
const SAMPLE_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function WatchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const imdbID = params.id;
  const { accessToken, profileId } = useAppSelector((s) => s.auth);
  const { data: title } = useTitleQuery(imdbID, { skip: !accessToken || !profileId });
  const [recordProgress] = useRecordProgressMutation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
    else if (!profileId) router.replace('/profiles');
  }, [accessToken, profileId, router]);

  const save = () => {
    const v = videoRef.current;
    if (!v || !title || !Number.isFinite(v.duration)) return;
    recordProgress({
      imdbID,
      title: title.title,
      poster: title.poster,
      positionS: Math.floor(v.currentTime),
      durationS: Math.floor(v.duration),
    });
  };

  const onTimeUpdate = () => {
    const now = Date.now();
    if (now - lastSent.current > 5000) {
      lastSent.current = now;
      save();
    }
  };

  useEffect(() => () => save(), []); // save on unmount

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 4%' }}>
        <button className="btn btn-dark" onClick={() => { save(); router.push('/browse'); }}>← Back</button>
        <span style={{ marginLeft: 16, fontWeight: 700 }}>{title?.title ?? 'Loading…'}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          ref={videoRef}
          src={SAMPLE_SRC}
          controls
          autoPlay
          onTimeUpdate={onTimeUpdate}
          onPause={save}
          onEnded={save}
          style={{ width: '100%', maxWidth: 1100, maxHeight: '80vh', background: '#000' }}
        />
      </div>
      <p className="muted" style={{ textAlign: 'center', padding: '10px 4% 24px', fontSize: 13 }}>
        Mock stream (sample video). OMDb provides metadata only — a real deployment would return a manifest
        and stream adaptive segments from a CDN. Your progress is saved to “Continue Watching”.
      </p>
    </div>
  );
}
