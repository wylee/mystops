import axios from "axios";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { containsExtent, buffer as bufferExtent } from "ol/extent";
import View from "ol/View";

import { AppThunk, RootState } from "../store";

import { FEATURE_LAYER_MAX_RESOLUTION } from "../map/const";
import { getExtentOfCoordinates } from "../map/utils";
import { decProgressCounter, incProgressCounter } from "../slice";
import { selectExtent, selectResolution, selectSize, setExtent, setZoom } from "../map/slice";

const API_URL = process.env.REACT_APP_API_URL;
const ARRIVALS_URL = `${API_URL}/arrivals`;
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

interface Error {
  title: string;
  message: string;
  detail?: string;
}

export interface SearchState {
  term: string;
  selectedStops: number[];
  result: any;
  error: Error | null;
  timestamp: any;
  timeoutID: number | null;
}

const initialState: SearchState = {
  term: "",
  selectedStops: [],
  result: null,
  error: null,
  timestamp: null,
  timeoutID: null,
};

const termToStopIDs = (term, throwError = false): number[] => {
  const items = term.trim().split(",");
  const stopIDs: number[] = [];
  for (let item of items) {
    const stopID = parseInt(item.trim(), 10);
    if (isNaN(stopID)) {
      if (throwError) {
        throw new Error(item);
      }
    } else {
      stopIDs.push(stopID);
    }
  }
  return stopIDs;
};

export const slice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setTerm: (state, action: PayloadAction<string>) => {
      state.term = action.payload;
    },
    setSelectedStops: (state, action: PayloadAction<number[]>) => {
      state.selectedStops = action.payload;
    },
    setResult: (state, action: PayloadAction<any>) => {
      state.error = null;
      state.result = action.payload;
    },
    setError: (state, action: PayloadAction<any>) => {
      state.result = null;
      state.error = action.payload;
    },
    resetSearchState: (state) => {
      if (requestCanceler) {
        requestCanceler.cancel();
      }
      if (state.timeoutID) {
        clearTimeout(state.timeoutID);
      }
      Object.keys(initialState).forEach((key) => {
        state[key] = initialState[key];
      });
      state.term = "";
      state.selectedStops = [];
      state.result = null;
      state.error = null;
    },
    setTimeoutID: (state, action: PayloadAction<number>) => {
      state.timeoutID = action.payload;
    },
  },
});

// Actions
export const { setTerm, setSelectedStops, setResult, setError, resetSearchState, setTimeoutID } =
  slice.actions;

let requestCanceler;

export const search =
  (term, append = false, removeIfPresent = false): AppThunk =>
  (dispatch, getState) => {
    dispatch(incProgressCounter());

    if (requestCanceler) {
      requestCanceler.cancel();
    }

    if (!term.trim()) {
      dispatch(resetSearchState());
      return;
    }

    if (getState().search.error) {
      dispatch(resetSearchState());
    }

    let newStopIDs;

    try {
      newStopIDs = termToStopIDs(term, true);
    } catch (e) {
      const id = e.message;
      dispatch(
        setError({
          title: `Bad Stop ID: ${id}`,
          message: "TriMet stop IDs should be numbers",
        })
      );
      dispatch(decProgressCounter());
      return;
    }

    if (append) {
      const currentTerm = getState().search.term.trim();
      if (currentTerm) {
        const currentStopIDs = termToStopIDs(currentTerm);
        currentStopIDs.forEach((id) => {
          const index = newStopIDs.indexOf(id);
          if (index === -1) {
            newStopIDs.push(id);
          } else if (removeIfPresent) {
            newStopIDs.splice(index, 1);
          }
        });
      }
    }

    if (newStopIDs.length === 0) {
      dispatch(resetSearchState());
      dispatch(decProgressCounter());
      return;
    }

    newStopIDs.sort((a, b) => a - b);
    term = newStopIDs.join(", ");
    dispatch(resetSearchState());
    dispatch(setTerm(term));
    dispatch(setSelectedStops(newStopIDs));
    requestCanceler = axios.CancelToken.source();

    return axios
      .get(ARRIVALS_URL, {
        params: { q: term.replace(/\s+/, "") },
        cancelToken: requestCanceler.token,
      })
      .then((response) => {
        const result = response.data;

        if (result.count) {
          const extent = selectExtent(getState());
          const resolution = selectResolution(getState());
          const coordinates = result.stops.map((stop) => stop.coordinates);
          const newExtent = getExtentOfCoordinates(coordinates, false);
          const timeoutID: any = setTimeout(() => dispatch(search(term)), REFRESH_INTERVAL);

          dispatch(setResult(result));
          dispatch(setTimeoutID(timeoutID));

          let doSetExtent = !containsExtent(extent, newExtent);
          doSetExtent = doSetExtent || resolution > FEATURE_LAYER_MAX_RESOLUTION;

          if (doSetExtent) {
            const size = selectSize(getState());
            const view = new View();
            const newResolution = view.getResolutionForExtent(newExtent, size);
            const buffer = newResolution * 46;
            const bufferedExtent = bufferExtent(newExtent, buffer);
            dispatch(setExtent(bufferedExtent));
          }
        }
      })
      .catch((error) => {
        const timeoutID: any = selectTimeoutID(getState());
        clearTimeout(timeoutID);
        if (axios.isCancel(error)) {
          return;
        }
        if (error.response) {
          const data = error.response.data;
          dispatch(setError(data.error));
        } else if (error.request) {
          dispatch(
            setError({
              title: "Error",
              message: "Unable to get arrivals at this time",
              detail: process.env.REACT_APP_DEBUG ? error.message : null,
            })
          );
        } else {
          console.error(error);
        }
      })
      .finally(() => {
        dispatch(decProgressCounter());
      });
  };

// Selectors
export const selectTerm = (state: RootState) => state.search.term;
export const selectSelectedStops = (state: RootState) => state.search.selectedStops;
export const selectResult = (state: RootState) => state.search.result;
export const selectError = (state: RootState) => state.search.error;
export const selectTimeoutID = (state: RootState) => state.search.timeoutID;

// Reducer
export default slice.reducer;
