import { configureStore } from '@reduxjs/toolkit';
import { indexApi } from './indexApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [indexApi.reducerPath]: indexApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(indexApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
