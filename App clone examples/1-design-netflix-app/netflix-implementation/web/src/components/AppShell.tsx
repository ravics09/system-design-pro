'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { CatalogContext } from './catalog-context';
import { Header } from './Header';
import { TitleModal } from './TitleModal';

/**
 * Wraps every authenticated page: guards access (redirect to /login or /profiles),
 * renders the header, and hosts the title-details modal via CatalogContext.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessToken, profileId } = useAppSelector((s) => s.auth);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
    else if (!profileId) router.replace('/profiles');
  }, [accessToken, profileId, router]);

  if (!accessToken || !profileId) {
    return <div className="centered muted">Loading…</div>;
  }

  return (
    <CatalogContext.Provider value={{ open: setOpenId }}>
      <Header />
      <main>{children}</main>
      {openId && <TitleModal imdbID={openId} onClose={() => setOpenId(null)} />}
    </CatalogContext.Provider>
  );
}
