'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProfileMutation, useDeleteProfileMutation, useGetProfilesQuery } from '../../store/api';
import { setProfile } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { avatarColor } from '../../components/Header';

export default function ProfilesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { data: profiles, isLoading } = useGetProfilesQuery(undefined, { skip: !accessToken });
  const [createProfile, createState] = useCreateProfileMutation();
  const [deleteProfile] = useDeleteProfileMutation();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('red');
  const [isKids, setIsKids] = useState(false);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  const choose = (id: string) => {
    dispatch(setProfile(id));
    router.replace('/browse');
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createProfile({ name, avatar, isKids });
    if ('data' in res && res.data) {
      setName('');
      setAdding(false);
    }
  };

  return (
    <div className="centered" style={{ flexDirection: 'column', gap: 24 }}>
      <h1>Who&apos;s watching?</h1>
      {isLoading && <p className="muted">Loading profiles…</p>}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(profiles ?? []).map((p) => (
          <div key={p.id} style={{ textAlign: 'center' }}>
            <button onClick={() => choose(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <div style={{ width: 110, height: 110, borderRadius: 8, background: avatarColor(p.avatar), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                {p.isKids ? '🧒' : '🙂'}
              </div>
              <div style={{ marginTop: 8 }}>{p.name}</div>
            </button>
            <button className="muted" onClick={() => deleteProfile(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, marginTop: 4 }}>
              remove
            </button>
          </div>
        ))}

        {(profiles?.length ?? 0) < 5 && !adding && (
          <button onClick={() => setAdding(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ width: 110, height: 110, borderRadius: 8, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#888' }}>＋</div>
            <div style={{ marginTop: 8 }} className="muted">Add profile</div>
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={add} style={{ display: 'grid', gap: 10, width: 'min(360px, 92%)', background: '#1c1c1c', padding: 20, borderRadius: 8 }}>
          <input className="input" placeholder="Profile name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
          <div style={{ display: 'flex', gap: 8 }}>
            {['red', 'blue', 'green', 'yellow', 'purple'].map((c) => (
              <button type="button" key={c} onClick={() => setAvatar(c)}
                style={{ width: 34, height: 34, borderRadius: 6, background: avatarColor(c), border: avatar === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <input type="checkbox" checked={isKids} onChange={(e) => setIsKids(e.target.checked)} /> Kids profile
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={createState.isLoading}>Create</button>
            <button className="btn btn-dark" type="button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
