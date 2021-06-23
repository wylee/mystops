import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";

import appReducer from "./slice";
import mapReducer from "./map/slice";
import searchReducer from "./search/slice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    map: mapReducer,
    search: searchReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
