import { configureStore } from "@reduxjs/toolkit";
import { commentsApi } from "./commentsApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      [commentsApi.reducerPath]: commentsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(commentsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
