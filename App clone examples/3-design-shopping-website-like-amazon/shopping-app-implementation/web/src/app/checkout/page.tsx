'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '../../components/RequireAuth';
import { AddressForm } from '../../components/AddressForm';
import { useCheckoutMutation, useGetAddressesQuery, useGetCartQuery } from '../../store/api';
import { formatMoney } from '../../lib/format';

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function CheckoutInner() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const { data: addresses, isLoading: addrLoading } = useGetAddressesQuery();
  const [checkout, { isLoading: placing }] = useCheckoutMutation();

  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // A stable idempotency key for this checkout attempt — retries won't double-charge.
  const idemKey = useRef<string>(newIdempotencyKey());

  // Default the selected address to the first one available.
  useEffect(() => {
    if (!selected && addresses && addresses.length > 0) setSelected(addresses[0].id);
    if (addresses && addresses.length === 0) setShowForm(true);
  }, [addresses, selected]);

  if (cartLoading || addrLoading) return <div className="center muted">Loading checkout…</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="card" style={{ margin: '24px 0', padding: 32, textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Your cart is empty</h1>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
          Continue shopping
        </Link>
      </div>
    );
  }

  const placeOrder = async () => {
    setError(null);
    if (!selected) {
      setError('Please select or add a shipping address.');
      return;
    }
    const res = await checkout({ addressId: selected, idempotencyKey: idemKey.current });
    if ('data' in res && res.data) {
      router.push(`/orders/${res.data.id}`);
    } else {
      const err = res.error as { data?: { message?: string } } | undefined;
      setError(err?.data?.message ?? 'Could not place your order. Please try again.');
    }
  };

  return (
    <div className="two-col">
      <div>
        <h1>Checkout</h1>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>1. Shipping address</h2>
          {addresses && addresses.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {addresses.map((a) => (
                <label
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: 10,
                    border: selected === a.id ? '2px solid var(--link)' : '1px solid var(--border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input type="radio" name="address" checked={selected === a.id} onChange={() => setSelected(a.id)} />
                  <span>
                    <b>{a.name}</b>
                    <br />
                    <span className="muted" style={{ fontSize: '0.9rem' }}>
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}, {a.city}
                      {a.state ? `, ${a.state}` : ''} {a.zip}, {a.country}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {showForm ? (
            <div style={{ marginTop: 14 }}>
              <h3 style={{ fontSize: '1rem' }}>Add a new address</h3>
              <AddressForm
                onCreated={(a) => {
                  setSelected(a.id);
                  setShowForm(false);
                }}
              />
            </div>
          ) : (
            <button className="btn" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
              + Add a new address
            </button>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>2. Payment</h2>
          <p className="muted" style={{ margin: 0 }}>
            This is a demo storefront — payment is mocked and orders are marked as <b>paid</b> instantly. No card
            details are collected.
          </p>
        </div>
      </div>

      <aside className="summary">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Order summary</h2>
        <div className="line">
          <span>Items ({cart.count})</span>
          <span>{formatMoney(cart.subtotalCents)}</span>
        </div>
        <div className="line">
          <span>Shipping</span>
          <span>{cart.shippingCents === 0 ? 'FREE' : formatMoney(cart.shippingCents)}</span>
        </div>
        <div className="line">
          <span>Estimated tax</span>
          <span>{formatMoney(cart.taxCents)}</span>
        </div>
        <div className="line total">
          <span>Order total</span>
          <span>{formatMoney(cart.totalCents)}</span>
        </div>
        {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={placeOrder} disabled={placing}>
          {placing ? 'Placing order…' : 'Place your order'}
        </button>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutInner />
    </RequireAuth>
  );
}
