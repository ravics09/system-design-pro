'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RequireAuth } from '../../../components/RequireAuth';
import { useGetOrderQuery } from '../../../store/api';
import { formatMoney } from '../../../lib/format';

function OrderDetailInner() {
  const params = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useGetOrderQuery(params.id);

  if (isLoading) return <div className="center muted">Loading order…</div>;
  if (isError || !order)
    return (
      <div className="center muted">
        Order not found. <Link href="/orders">&nbsp;Back to orders</Link>
      </div>
    );

  const a = order.address;

  return (
    <div>
      <p className="muted" style={{ margin: '14px 0' }}>
        <Link href="/orders">Your Orders</Link> › Order details
      </p>

      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>ORDER PLACED</div>
          <div>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>ORDER #</div>
          <div style={{ fontFamily: 'monospace' }}>{order.id}</div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>STATUS</div>
          <span className="badge badge-green">{order.status}</span>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Items</h2>
          {order.items.map((item) => (
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
                <div className="muted" style={{ marginTop: 4 }}>
                  Qty: {item.qty}
                </div>
              </div>
              <div className="price">{formatMoney(item.priceCents * item.qty)}</div>
            </div>
          ))}
        </div>

        <aside>
          <div className="summary" style={{ position: 'static', marginBottom: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Order summary</h2>
            <div className="line">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotalCents)}</span>
            </div>
            <div className="line">
              <span>Shipping</span>
              <span>{order.shippingCents === 0 ? 'FREE' : formatMoney(order.shippingCents)}</span>
            </div>
            <div className="line">
              <span>Tax</span>
              <span>{formatMoney(order.taxCents)}</span>
            </div>
            <div className="line total">
              <span>Total</span>
              <span>{formatMoney(order.totalCents)}</span>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Shipping to</h2>
            <div className="muted" style={{ fontSize: '0.9rem' }}>
              <b style={{ color: '#0f1111' }}>{a.name}</b>
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
              <br />
              {a.city}
              {a.state ? `, ${a.state}` : ''} {a.zip}
              <br />
              {a.country}
              {a.phone ? ` · ${a.phone}` : ''}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetailInner />
    </RequireAuth>
  );
}
