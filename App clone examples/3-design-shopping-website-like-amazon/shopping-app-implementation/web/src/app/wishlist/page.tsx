'use client';

import Link from 'next/link';
import { RequireAuth } from '../../components/RequireAuth';
import {
  useAddToCartMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from '../../store/api';
import { formatMoney } from '../../lib/format';

function WishlistInner() {
  const { data: items, isLoading } = useGetWishlistQuery();
  const [addToCart] = useAddToCartMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  if (isLoading) return <div className="center muted">Loading your wishlist…</div>;

  if (!items || items.length === 0) {
    return (
      <div className="card" style={{ margin: '24px 0', padding: 32, textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Your wishlist is empty</h1>
        <p className="muted">Tap the heart on any product to save it for later.</p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
          Browse the store
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Wishlist</h1>
      <div className="card">
        {items.map((item) => (
          <div key={item.productId} className="row-item">
            <Link href={`/product/${item.productId}`} className="thumb-sm">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} />
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>
                  No image
                </span>
              )}
            </Link>
            <div>
              <Link href={`/product/${item.productId}`}>
                <b>{item.name}</b>
              </Link>
              <div className="price" style={{ marginTop: 6 }}>
                {formatMoney(item.priceCents)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  addToCart({
                    productId: item.productId,
                    name: item.name,
                    priceCents: item.priceCents,
                    image: item.image,
                    qty: 1,
                  })
                }
              >
                Add to cart
              </button>
              <button className="btn" onClick={() => removeFromWishlist(item.productId)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <RequireAuth>
      <WishlistInner />
    </RequireAuth>
  );
}
