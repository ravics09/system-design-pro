import { configureStore } from "@reduxjs/toolkit";
import { apiConsoleApi } from "./apiConsoleApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [apiConsoleApi.reducerPath]: apiConsoleApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(apiConsoleApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
