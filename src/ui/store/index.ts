import { InjectionKey } from "vue";
import { createStore, useStore as baseUseStore, Store } from "vuex";

import axios, { CancelTokenSource } from "axios";

import { ARRIVALS_URL, REFRESH_INTERVAL } from "../const";

type Result = any;

interface Error {
  title: string;
  explanation: string;
  detail?: string;
}

interface MapContextMenuState {
  open: boolean;
  x: number;
  y: number;
}

export interface State {
  menuOpen: boolean;
  term: string;
  stops: number[];
  result: Result | null;
  error: Error | null;
  cancelTokenSource: CancelTokenSource | undefined;
  timeoutID: number | undefined;
  baseLayer: number;
  mapContextMenu: MapContextMenuState;
}

export const key: InjectionKey<Store<State>> = Symbol();

// XXX: Use this rather than importing useStore from vuex in order to
//      get typing support;
export function useStore(): Store<State> {
  return baseUseStore(key);
}

export const store = createStore<State>({
  strict: process.env.NODE_ENV !== "production",
  state() {
    return {
      menuOpen: false,
      term: "",
      stops: [],
      result: null,
      error: null,
      cancelTokenSource: undefined,
      timeoutID: undefined,
      baseLayer: 0,
      mapContextMenu: {
        open: false,
        x: 0,
        y: 0,
      },
    };
  },
  mutations: {
    openMenu(state) {
      state.menuOpen = true;
    },
    closeMenu(state) {
      state.menuOpen = false;
    },
    toggleMenu(state) {
      state.menuOpen = !state.menuOpen;
    },
    setSearchTerm(state, payload: { term: string }) {
      state.term = payload.term;
    },
    toggleStopID(state, payload: { stopID: number }) {
      // Add stop ID to search term if it's not already present;
      // remove it if it is.
      const stopIDs = termToStopIDs(state.term);
      const newID = termToStopIDs(payload.stopID.toString())[0];
      const index = stopIDs.indexOf(newID);
      if (index === -1) {
        stopIDs.push(newID);
      } else {
        stopIDs.splice(index, 1);
      }
      stopIDs.sort((a, b) => a - b);
      state.term = stopIDs.join(", ");
    },
    setStops(state, payload: { stops: number[] }) {
      state.stops = payload.stops;
    },
    setResult(state, payload: { result: Result }) {
      state.result = payload.result;
    },
    setSearchState(
      state,
      payload: {
        term: string;
        stops?: number[];
        result?: Result;
        error?: Error;
        cancelTokenSource?: undefined;
        timeoutID?: undefined;
      }
    ) {
      state.term = payload.term;
      state.stops = payload.stops ?? termToStopIDs(payload.term);
      state.result = payload.result ?? null;
      state.error = payload.error ?? null;
      state.cancelTokenSource = payload.cancelTokenSource;
      state.timeoutID = payload.timeoutID;
    },
    resetSearchState(state) {
      if (state.cancelTokenSource) {
        state.cancelTokenSource.cancel();
      }
      clearTimeout(state.timeoutID);
      state.term = "";
      state.stops = [];
      state.result = null;
      state.error = null;
      state.cancelTokenSource = undefined;
      state.timeoutID = undefined;
    },
    setError(state, payload: Error) {
      state.error = payload;
    },
    setCancelTokenSource(state, payload?: { source: CancelTokenSource }) {
      if (state.cancelTokenSource) {
        state.cancelTokenSource.cancel();
      }
      state.cancelTokenSource = payload?.source;
    },
    setTimeoutID(state, payload?: { timeoutID: number }) {
      clearTimeout(state.timeoutID);
      state.timeoutID = payload?.timeoutID;
    },
    setBaseLayer(state, payload: { baseLayer: number }) {
      state.baseLayer = payload.baseLayer;
    },
    nextBaseLayer(state, payload: { numBaseLayers: number }) {
      state.baseLayer = (state.baseLayer + 1) % payload.numBaseLayers;
    },
    setMapContextMenuState(state, payload: MapContextMenuState) {
      state.mapContextMenu = payload;
    },
    closeMapContextMenu(state) {
      state.mapContextMenu = { open: false, x: 0, y: 0 };
    },
  },
  actions: {
    search({ commit, dispatch }, payload: { term: string }) {
      let { term } = payload;

      commit("resetSearchState");

      if (!term.trim()) {
        commit("setSearchTerm", { term });
        return;
      }

      let stops: number[];

      try {
        stops = termToStopIDs(term);
      } catch (e) {
        commit("setSearchState", {
          term,
          stops: [],
          error: {
            title: e.name,
            explanation: e.message,
            detail: e.detail,
          },
        });
        return;
      }

      const cancelTokenSource = axios.CancelToken.source();

      term = stops.join(", ");
      commit("setSearchState", { term, stops, cancelTokenSource });

      return axios
        .get(ARRIVALS_URL, {
          params: { q: stops.join(",") },
          cancelToken: cancelTokenSource.token,
        })
        .then((response) => {
          const result = response.data;
          if (result.count) {
            commit("setResult", { result: result });
            commit("setTimeoutID", {
              timeoutID: setTimeout(
                () => dispatch("search", { term }),
                REFRESH_INTERVAL
              ),
            });
          }
        })
        .catch((error) => {
          console.error(error);
          if (axios.isCancel(error)) {
            return;
          }
        });
    },
  },
  modules: {},
});

function termToStopIDs(term: string): number[] {
  const trimmed = term.replace(/^[ ,]+/, "").replace(/[ ,]+$/, "");
  if (!trimmed) {
    return [];
  }
  const items = trimmed.split(",");
  const stops: number[] = [];
  const bad: string[] = [];
  for (const item of items) {
    const stopID = parseInt(item.trim(), 10);
    if (isNaN(stopID)) {
      bad.push(item);
    } else if (stops.indexOf(stopID) === -1) {
      stops.push(stopID);
    }
  }
  if (bad.length) {
    throw new InvalidStopIDError(bad);
  }
  stops.sort((a, b) => a - b);
  return stops;
}

class InvalidStopIDError {
  name = "Bad Stop ID";
  stopIDs: string[];
  message: string;
  detail = "TriMet stop IDs are numbers like 4, 17, etc";

  constructor(stopIDs: string[]) {
    const ess = stopIDs.length === 1 ? "" : "s";
    const verb = stopIDs.length === 1 ? "is" : "are";
    const string = stopIDs.join(", ");
    this.stopIDs = stopIDs;
    this.message = `The following stop ID${ess} ${verb} not valid: ${string}`;
  }

  toString() {
    return this.message;
  }
}
