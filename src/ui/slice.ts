import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "./store";

export interface AppState {
  menuOpen: boolean;
  progressCounter: number;
  activeStops: number[];
  bottomSheetContent: string | null;
}

const initialState: AppState = {
  menuOpen: false,
  progressCounter: 0,
  activeStops: [],
  bottomSheetContent: null,
};

export const slice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // Main menu
    openMainMenu: (state) => {
      state.menuOpen = true;
    },
    closeMainMenu: (state) => {
      state.menuOpen = false;
    },
    toggleMainMenu: (state) => {
      state.menuOpen = !state.menuOpen;
    },
    // Progress counter/indicator
    incProgressCounter: (state) => {
      state.progressCounter += 1;
    },
    decProgressCounter: (state) => {
      state.progressCounter -= 1;
    },
    // Bottom sheet
    setBottomSheetContent: (state, action: PayloadAction<string | null>) => {
      state.bottomSheetContent = action.payload;
    },
  },
});

// Actions
export const {
  openMainMenu,
  closeMainMenu,
  toggleMainMenu,
  incProgressCounter,
  decProgressCounter,
  setBottomSheetContent,
} = slice.actions;

// Selectors
export const selectMainMenuOpen = (state: RootState) => state.app.menuOpen;
export const selectProgressCounter = (state: RootState) => state.app.progressCounter;
export const selectBottomSheetContent = (state: RootState) => state.app.bottomSheetContent;

// Reducer
export default slice.reducer;
