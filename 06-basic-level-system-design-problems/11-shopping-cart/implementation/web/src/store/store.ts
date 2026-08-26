import { configureStore } from "@reduxjs/toolkit";
import { cartApi } from "./cartApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [cartApi.reducerPath]: cartApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(cartApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
