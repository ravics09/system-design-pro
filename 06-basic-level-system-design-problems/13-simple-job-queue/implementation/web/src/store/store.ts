import { configureStore } from '@reduxjs/toolkit';
import { queueApi } from './queueApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [queueApi.reducerPath]: queueApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(queueApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
