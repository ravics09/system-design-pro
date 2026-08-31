'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../store/hooks';

export default function Home() {
  const router = useRouter();
  const { accessToken, profileId } = useAppSelector((s) => s.auth);
  useEffect(() => {
    if (!accessToken) router.replace('/login');
    else if (!profileId) router.replace('/profiles');
    else router.replace('/browse');
  }, [accessToken, profileId, router]);
  return <div className="centered muted">Loading…</div>;
}
