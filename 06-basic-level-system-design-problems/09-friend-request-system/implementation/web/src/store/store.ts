import { configureStore } from "@reduxjs/toolkit";
import { friendsApi } from "./friendsApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [friendsApi.reducerPath]: friendsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(friendsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
