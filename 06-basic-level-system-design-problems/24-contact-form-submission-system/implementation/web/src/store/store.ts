import { configureStore } from '@reduxjs/toolkit';
import { contactApi } from './contactApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [contactApi.reducerPath]: contactApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(contactApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
