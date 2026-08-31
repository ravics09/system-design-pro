import { configureStore } from '@reduxjs/toolkit';
import { lifecycleApi } from './lifecycleApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [lifecycleApi.reducerPath]: lifecycleApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(lifecycleApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
