import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthResult, User } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

const STORAGE_KEY = 'shopping.auth';

const empty: AuthState = { accessToken: null, refreshToken: null, user: null };

function persist(state: AuthState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadInitial(): AuthState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: empty,
  reducers: {
    /** Rehydrate from localStorage on the client (called once on mount). */
    hydrate: (state) => {
      const loaded = loadInitial();
      state.accessToken = loaded.accessToken;
      state.refreshToken = loaded.refreshToken;
      state.user = loaded.user;
    },
    setCredentials: (state, action: PayloadAction<AuthResult>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      persist(state);
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { hydrate, setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
