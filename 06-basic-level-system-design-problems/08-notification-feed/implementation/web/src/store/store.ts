import { configureStore } from "@reduxjs/toolkit";
import { notificationsApi } from "./notificationsApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(notificationsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
