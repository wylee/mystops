import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import appReducer from "./slice";
import mapReducer from "./map/slice";
import searchReducer from "./search/slice";
import { arrivalsAPI } from "./search/api";

export const store = configureStore({
  reducer: {
    app: appReducer,
    map: mapReducer,
    search: searchReducer,
    [arrivalsAPI.reducerPath]: arrivalsAPI.reducer,
  },
  middleware: (defaultMiddleware) => defaultMiddleware().concat(arrivalsAPI.middleware),
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
