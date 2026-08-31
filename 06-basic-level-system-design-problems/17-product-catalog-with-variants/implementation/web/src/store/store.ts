import { configureStore } from '@reduxjs/toolkit';
import { catalogApi } from './catalogApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [catalogApi.reducerPath]: catalogApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(catalogApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
