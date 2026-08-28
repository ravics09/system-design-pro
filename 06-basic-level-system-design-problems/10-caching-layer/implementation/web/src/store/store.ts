import { configureStore } from "@reduxjs/toolkit";
import { cacheApi } from "./cacheApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [cacheApi.reducerPath]: cacheApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(cacheApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
