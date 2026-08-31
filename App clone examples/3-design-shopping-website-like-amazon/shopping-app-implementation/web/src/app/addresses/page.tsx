'use client';

import { RequireAuth } from '../../components/RequireAuth';
import { AddressForm } from '../../components/AddressForm';
import { useDeleteAddressMutation, useGetAddressesQuery } from '../../store/api';

function AddressesInner() {
  const { data: addresses, isLoading } = useGetAddressesQuery();
  const [deleteAddress] = useDeleteAddressMutation();

  return (
    <div className="two-col">
      <div>
        <h1>Your Addresses</h1>
        {isLoading ? (
          <div className="muted">Loading…</div>
        ) : !addresses || addresses.length === 0 ? (
          <div className="card muted">No saved addresses yet. Add one on the right.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {addresses.map((a) => (
              <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <b>{a.name}</b>
                  <div className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
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
                <button className="btn" style={{ height: 'fit-content' }} onClick={() => deleteAddress(a.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="summary">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add a new address</h2>
        <AddressForm />
      </aside>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireAuth>
      <AddressesInner />
    </RequireAuth>
  );
}
