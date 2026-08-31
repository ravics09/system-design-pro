'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '../store/hooks';

/**
 * Client-side guard for account pages. Auth is rehydrated from localStorage by
 * Providers before children render, so a null user here means "not signed in".
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthed = useAppSelector((s) => !!s.auth.user);

  useEffect(() => {
    if (!isAuthed) router.replace('/login');
  }, [isAuthed, router]);

  if (!isAuthed) {
    return (
      <div className="center muted">
        Please <Link href="/login">&nbsp;sign in&nbsp;</Link> to continue.
      </div>
    );
  }
  return <>{children}</>;
}
