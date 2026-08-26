import { configureStore } from "@reduxjs/toolkit";
import { urlsApi } from "./urlsApi";

/** The Redux store — RTK Query manages the API cache + async lifecycle. */
export const makeStore = () =>
  configureStore({
    reducer: {
      [urlsApi.reducerPath]: urlsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(urlsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
