'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategoriesQuery, useProductsQuery } from '../store/api';
import { ProductTile } from '../components/ProductTile';
import type { SortOption } from '../types';

const PER_PAGE = 12;

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Avg. customer review' },
  { value: 'date', label: 'Newest arrivals' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

function CatalogInner() {
  const router = useRouter();
  const params = useSearchParams();

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as SortOption) || undefined;

  const { data: categories } = useCategoriesQuery();
  const { data, isLoading, isError } = useProductsQuery({ page, perPage: PER_PAGE, search, category, sort });

  const setParam = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params.toString());
    mutate(p);
    p.delete('page'); // any filter change resets to page 1
    router.push(`/?${p.toString()}`);
  };

  const goPage = (next: number) => {
    const p = new URLSearchParams(params.toString());
    p.set('page', String(next));
    router.push(`/?${p.toString()}`);
    window.scrollTo({ top: 0 });
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="layout">
      <aside className="sidebar">
        <h3>Departments</h3>
        <ul className="cat-list">
          <li>
            <button className={!category ? 'active' : ''} onClick={() => setParam((p) => p.delete('category'))}>
              All departments
            </button>
          </li>
          {(categories ?? []).map((c) => (
            <li key={c.id}>
              <button
                className={category === String(c.id) ? 'active' : ''}
                onClick={() => setParam((p) => p.set('category', String(c.id)))}
              >
                {c.name} ({c.count})
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section>
        <div className="toolbar">
          <div className="muted">
            {search ? (
              <>
                Results for <b>&ldquo;{search}&rdquo;</b> —{' '}
              </>
            ) : null}
            {isLoading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
          </div>
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Sort by:
            <select
              className="select"
              value={sort ?? ''}
              onChange={(e) => setParam((p) => (e.target.value ? p.set('sort', e.target.value) : p.delete('sort')))}
            >
              <option value="">Featured</option>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {data && !data.configured && (
          <div className="notice">
            The catalog is not configured yet. Set <code>WC_BASE_URL</code>, <code>WC_CONSUMER_KEY</code> and{' '}
            <code>WC_CONSUMER_SECRET</code> on the server to load products from your WooCommerce store.
          </div>
        )}

        {isError && <div className="error">Could not load products. Please try again.</div>}

        {!isLoading && data && data.items.length === 0 && data.configured && (
          <div className="center muted">No products found. Try a different search or department.</div>
        )}

        <div className="grid">
          {(data?.items ?? []).map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn" disabled={page <= 1} onClick={() => goPage(page - 1)}>
              ← Prev
            </button>
            <span className="muted">
              Page {page} of {totalPages}
            </span>
            <button className="btn" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="center muted">Loading storefront…</div>}>
      <CatalogInner />
    </Suspense>
  );
}
