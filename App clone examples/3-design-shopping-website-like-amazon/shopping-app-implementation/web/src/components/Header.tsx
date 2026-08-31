'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuth } from '../store/authSlice';
import { useCategoriesQuery, useGetCartQuery, useLogoutMutation } from '../store/api';

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, refreshToken } = useAppSelector((s) => s.auth);
  const isAuthed = !!user;

  const [logout] = useLogoutMutation();
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthed });
  const { data: categories } = useCategoriesQuery();

  // Read the current search term from the URL without useSearchParams (which would
  // force a Suspense boundary on every route since the Header lives in the layout).
  const [term, setTerm] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search') ?? '';
    setTerm(q);
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : '/');
  };

  const doLogout = async () => {
    if (refreshToken) {
      try {
        await logout(refreshToken).unwrap();
      } catch {
        /* ignore network errors on logout */
      }
    }
    dispatch(clearAuth());
    router.push('/');
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          Shop<span>Clone</span>
        </Link>

        <form className="search" onSubmit={submitSearch}>
          <input
            aria-label="Search products"
            placeholder="Search products"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {isAuthed ? (
          <>
            <Link href="/orders" className="nav-link">
              Returns<b>&amp; Orders</b>
            </Link>
            <Link href="/wishlist" className="nav-link">
              Your<b>Wishlist</b>
            </Link>
            <Link href="/addresses" className="nav-link">
              Your<b>Addresses</b>
            </Link>
            <button type="button" className="nav-link" onClick={doLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              Hello, {user!.email.split('@')[0]}<b>Sign Out</b>
            </button>
          </>
        ) : (
          <Link href="/login" className="nav-link">
            Hello, sign in<b>Account</b>
          </Link>
        )}

        <Link href="/cart" className="cart-link">
          🛒 Cart {isAuthed && cart ? <span className="cart-badge">{cart.count}</span> : null}
        </Link>
      </div>

      <div className="subnav">
        <div className="subnav-inner">
          <Link href="/">All</Link>
          {(categories ?? []).slice(0, 12).map((c) => (
            <Link key={c.id} href={`/?category=${c.id}`}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
