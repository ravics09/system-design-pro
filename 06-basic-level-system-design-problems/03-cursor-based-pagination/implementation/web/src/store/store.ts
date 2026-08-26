import { configureStore } from "@reduxjs/toolkit";
import { itemsApi } from "./itemsApi";

/** The Redux store — RTK Query manages the items cache + async lifecycle. */
export const makeStore = () =>
  configureStore({
    reducer: {
      [itemsApi.reducerPath]: itemsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(itemsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
