import { configureStore } from '@reduxjs/toolkit';
import { configApi } from './configApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [configApi.reducerPath]: configApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(configApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
