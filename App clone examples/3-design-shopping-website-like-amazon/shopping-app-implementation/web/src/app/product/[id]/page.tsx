'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAddToCartMutation, useAddToWishlistMutation, useProductQuery } from '../../../store/api';
import { useAppSelector } from '../../../store/hooks';
import { formatMoney } from '../../../lib/format';
import { Stars } from '../../../components/Stars';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const isAuthed = useAppSelector((s) => !!s.auth.user);

  const { data: product, isLoading, isError } = useProductQuery(id, { skip: !Number.isFinite(id) });
  const [addToCart, addState] = useAddToCartMutation();
  const [addToWishlist, wishState] = useAddToWishlistMutation();

  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  if (isLoading) return <div className="center muted">Loading product…</div>;
  if (isError || !product) return <div className="center muted">Product not found. <Link href="/">Back to store</Link></div>;

  const requireAuth = () => {
    if (!isAuthed) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const doAddToCart = async () => {
    if (!requireAuth()) return;
    await addToCart({ productId: product.id, name: product.name, priceCents: product.priceCents, image: product.image, qty });
    setAdded(true);
  };

  const doAddToWishlist = async () => {
    if (!requireAuth()) return;
    await addToWishlist({ productId: product.id, name: product.name, priceCents: product.priceCents, image: product.image });
  };

  const gallery = product.images.length ? product.images : product.image ? [product.image] : [];
  const onSale = product.regularPriceCents != null && product.regularPriceCents > product.priceCents;

  return (
    <div>
      <p className="muted" style={{ margin: '14px 0' }}>
        <Link href="/">Store</Link> ›{' '}
        {product.categories[0] ? <Link href={`/?category=${product.categories[0].id}`}>{product.categories[0].name}</Link> : 'Product'}
      </p>

      <div className="two-col">
        <div>
          <div className="detail-media">
            {gallery[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery[active]} alt={product.name} />
            ) : (
              <span className="muted">No image available</span>
            )}
          </div>
          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    border: i === active ? '2px solid var(--link)' : '1px solid var(--border)',
                    borderRadius: 6,
                    padding: 2,
                    background: '#fff',
                    cursor: 'pointer',
                    width: 60,
                    height: 60,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 20 }}>
            <h2 style={{ marginTop: 0 }}>Product description</h2>
            {product.description ? (
              <div className="muted" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="muted">No description provided.</p>
            )}
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: '1.5rem', marginTop: 0 }}>{product.name}</h1>
          {product.rating > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Stars rating={product.rating} /> <span className="muted">{product.rating.toFixed(1)}</span>
            </div>
          )}
          {product.shortDescription && (
            <div className="muted" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
          )}

          <div className="buybox">
            <div>
              <span className="price price-lg">{formatMoney(product.priceCents, product.currency)}</span>
              {onSale && <span className="strike">{formatMoney(product.regularPriceCents!, product.currency)}</span>}
            </div>
            <div className={product.inStock ? 'badge badge-green' : 'badge badge-gray'} style={{ width: 'fit-content' }}>
              {product.inStock ? 'In stock' : 'Currently unavailable'}
            </div>

            <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Qty:
              <select className="select" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <button className="btn btn-primary btn-block" onClick={doAddToCart} disabled={!product.inStock || addState.isLoading}>
              {addState.isLoading ? 'Adding…' : 'Add to cart'}
            </button>
            <button className="btn btn-block" onClick={doAddToWishlist} disabled={wishState.isLoading}>
              {wishState.isLoading ? 'Saving…' : wishState.isSuccess ? '♥ Saved to wishlist' : '♡ Add to wishlist'}
            </button>

            {added && (
              <div className="badge badge-green" style={{ textAlign: 'center' }}>
                Added to cart — <Link href="/cart">view cart</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
