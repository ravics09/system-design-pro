'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogoutMutation } from '../store/api';
import { clearAuth, setProfile } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const AVATARS: Record<string, string> = {
  red: '#e50914', blue: '#2563eb', green: '#16a34a', yellow: '#eab308', purple: '#7c3aed',
};

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);

  const signOut = async () => {
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    dispatch(clearAuth());
    router.replace('/login');
  };

  return (
    <header className="header">
      <Link href="/browse" className="brand" style={{ fontSize: '1.4rem' }}>NETFLIX</Link>
      <nav>
        <Link href="/browse">Home</Link>
        <Link href="/search">Search</Link>
        <Link href="/my-list">My List</Link>
      </nav>
      <span className="spacer" />
      <button className="btn btn-dark" style={{ padding: '6px 12px' }} onClick={() => { dispatch(setProfile(null)); router.replace('/profiles'); }}>
        Switch profile
      </button>
      <button className="btn btn-dark" style={{ padding: '6px 12px' }} onClick={signOut}>Sign out</button>
    </header>
  );
}

export const avatarColor = (a: string): string => AVATARS[a] ?? '#e50914';
