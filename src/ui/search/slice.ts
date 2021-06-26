import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

import { termToStopIDs } from "./util";

export interface SearchState {
  term: string;
  submit: boolean;
  result: any;
}

const initialState: SearchState = {
  term: "",
  submit: false,
  result: null,
};

export const slice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setTerm: (state, action: PayloadAction<string>) => {
      const term = termToStopIDs(action.payload);
      state.term = term.join(", ");
    },
    toggleTerm: (state, action: PayloadAction<string>) => {
      // Remove any new IDs that are already in term.
      // Add any new IDs that aren't already in term.
      const stopIDs = termToStopIDs(state.term);
      const newID = termToStopIDs(action.payload)[0];
      const index = stopIDs.indexOf(newID);
      if (index === -1) {
        stopIDs.push(newID);
      } else {
        stopIDs.splice(index, 1);
      }
      state.term = stopIDs.join(", ");
    },
    setSubmit: (state, action: PayloadAction<boolean>) => {
      state.submit = action.payload;
    },
    setResult: (state, action: PayloadAction<any>) => {
      state.result = action.payload;
    },
    resetSearchState: (state) => {
      state.term = "";
      state.submit = false;
      state.result = null;
    },
  },
});

// Actions
export const { setTerm, toggleTerm, setSubmit, setResult, resetSearchState } = slice.actions;

// Selectors
export const selectTerm = (state: RootState) => state.search.term;
export const selectSubmit = (state: RootState) => state.search.submit;
export const selectResult = (state: RootState) => state.search.result;

// Reducer
export default slice.reducer;
