'use client';

import Link from 'next/link';
import { RequireAuth } from '../../components/RequireAuth';
import { useGetOrdersQuery } from '../../store/api';
import { formatMoney } from '../../lib/format';

function OrdersInner() {
  const { data: orders, isLoading } = useGetOrdersQuery();

  if (isLoading) return <div className="center muted">Loading your orders…</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="card" style={{ margin: '24px 0', padding: 32, textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>No orders yet</h1>
        <p className="muted">When you place an order it will show up here.</p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Orders</h1>
      <div style={{ display: 'grid', gap: 14 }}>
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  ORDER PLACED
                </div>
                <div>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  TOTAL
                </div>
                <div className="price">{formatMoney(o.totalCents)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  STATUS
                </div>
                <span className="badge badge-green">{o.status}</span>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <Link href={`/orders/${o.id}`} className="btn">
                  View order
                </Link>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 10, fontSize: '0.9rem' }}>
              {o.items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersInner />
    </RequireAuth>
  );
}
