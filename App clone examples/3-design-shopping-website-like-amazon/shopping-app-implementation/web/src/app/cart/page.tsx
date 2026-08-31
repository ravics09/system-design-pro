'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '../../components/RequireAuth';
import {
  useClearCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
  useSetCartQtyMutation,
} from '../../store/api';
import { formatMoney } from '../../lib/format';

function CartInner() {
  const router = useRouter();
  const { data: cart, isLoading } = useGetCartQuery();
  const [setQty] = useSetCartQtyMutation();
  const [removeItem] = useRemoveFromCartMutation();
  const [clearCart] = useClearCartMutation();

  if (isLoading) return <div className="center muted">Loading your cart…</div>;

  // Cart line items are stored without a currency; the store currency is USD by default.
  const currency = 'USD';

  if (!cart || cart.items.length === 0) {
    return (
      <div className="card" style={{ margin: '24px 0', padding: 32, textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Your ShopClone Cart is empty</h1>
        <p className="muted">Browse the store to find something you love.</p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="two-col">
      <div>
        <h1>Shopping Cart</h1>
        <div className="card">
          {cart.items.map((item) => (
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
                <div className="price" style={{ margin: '6px 0' }}>
                  {formatMoney(item.priceCents, currency)}
                </div>
                <div className="qty">
                  <button onClick={() => setQty({ productId: item.productId, qty: Math.max(1, item.qty - 1) })}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => setQty({ productId: item.productId, qty: Math.min(99, item.qty + 1) })}>+</button>
                  <button
                    className="btn"
                    style={{ marginLeft: 12, padding: '4px 10px' }}
                    onClick={() => removeItem(item.productId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="price">{formatMoney(item.priceCents * item.qty, currency)}</div>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <button className="btn" onClick={() => clearCart()}>
              Clear cart
            </button>
          </div>
        </div>
      </div>

      <aside className="summary">
        <div className="line">
          <span>Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'})</span>
          <span>{formatMoney(cart.subtotalCents, currency)}</span>
        </div>
        <div className="line">
          <span>Shipping</span>
          <span>{cart.shippingCents === 0 ? 'FREE' : formatMoney(cart.shippingCents, currency)}</span>
        </div>
        <div className="line">
          <span>Estimated tax</span>
          <span>{formatMoney(cart.taxCents, currency)}</span>
        </div>
        <div className="line total">
          <span>Order total</span>
          <span>{formatMoney(cart.totalCents, currency)}</span>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => router.push('/checkout')}>
          Proceed to checkout
        </button>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartInner />
    </RequireAuth>
  );
}
