'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { hydrate } from './authSlice';

/** Redux provider that rehydrates auth from localStorage before rendering children. */
export function Providers({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storeRef.current!.dispatch(hydrate());
    setReady(true);
  }, []);

  return (
    <Provider store={storeRef.current}>
      {/* Avoid flashing logged-out UI before hydration completes. */}
      <div style={{ visibility: ready ? 'visible' : 'hidden' }}>{children}</div>
    </Provider>
  );
}
