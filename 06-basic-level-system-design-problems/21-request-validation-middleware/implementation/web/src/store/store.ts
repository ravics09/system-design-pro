import { configureStore } from '@reduxjs/toolkit';
import { validationApi } from './validationApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      [validationApi.reducerPath]: validationApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(validationApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
