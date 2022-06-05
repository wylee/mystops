import { defineStore } from "pinia";

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
  result?: Result;
  error?: Error;
  cancelTokenSource?: CancelTokenSource;
  timeoutID?: number;
  baseLayer: number;
  mapContextMenu: MapContextMenuState;
}

export const useStore = defineStore("main", {
  state: (): State => {
    return {
      menuOpen: false,
      term: "",
      stops: [],
      result: undefined,
      error: undefined,
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

  actions: {
    // Error handling
    setError(payload: Error) {
      this.error = payload;
    },

    // Main menu
    openMenu() {
      this.menuOpen = true;
    },
    closeMenu() {
      this.menuOpen = false;
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },

    // Map context menu
    closeMapContextMenu() {
      this.mapContextMenu = { open: false, x: 0, y: 0 };
    },
    setMapContextMenuState(payload: MapContextMenuState) {
      this.mapContextMenu = payload;
    },

    // Map layers
    setBaseLayer(payload: { baseLayer: number }) {
      this.baseLayer = payload.baseLayer;
    },
    nextBaseLayer(payload: { numBaseLayers: number }) {
      this.baseLayer = (this.baseLayer + 1) % payload.numBaseLayers;
    },

    // Search
    setSearchTerm(payload: { term: string }) {
      this.term = payload.term;
    },
    setStops(payload: { stops: number[] }) {
      this.stops = payload.stops;
    },
    setResult(payload: { result: Result }) {
      this.result = payload.result;
    },
    setCancelTokenSource(payload?: { source: CancelTokenSource }) {
      this.cancelTokenSource?.cancel();
      this.cancelTokenSource = payload?.source;
    },
    setTimeoutID(payload?: { timeoutID: number }) {
      clearTimeout(this.timeoutID);
      this.timeoutID = payload?.timeoutID;
    },
    toggleStopID(payload: { stopID: number }) {
      // Add stop ID to search term if it's not already present;
      // remove it if it is.
      const stopIDs = termToStopIDs(this.term);
      const newID = termToStopIDs(payload.stopID.toString())[0];
      const index = stopIDs.indexOf(newID);
      if (index === -1) {
        stopIDs.push(newID);
      } else {
        stopIDs.splice(index, 1);
      }
      stopIDs.sort((a, b) => a - b);
      this.term = stopIDs.join(", ");
    },
    setSearchState(payload: {
      term: string;
      stops?: number[];
      result?: Result;
      error?: Error;
      cancelTokenSource?: CancelTokenSource;
      timeoutID?: undefined;
    }) {
      this.$patch({
        ...payload,
        stops: payload.stops ?? termToStopIDs(payload.term),
      });
    },
    resetSearchState() {
      this.cancelTokenSource?.cancel();
      clearTimeout(this.timeoutID);
      this.$patch({
        term: "",
        stops: [],
        result: undefined,
        error: undefined,
        cancelTokenSource: undefined,
        timeoutID: undefined,
      });
    },
    search(payload: { term: string }) {
      let { term } = payload;

      this.resetSearchState();

      if (!term.trim()) {
        this.setSearchTerm({ term });
        return;
      }

      let stops: number[];

      try {
        stops = termToStopIDs(term);
      } catch (e: any) {
        this.setSearchState({
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
      this.setSearchState({ term, stops, cancelTokenSource });

      return axios
        .get(ARRIVALS_URL, {
          params: { q: stops.join(",") },
          cancelToken: cancelTokenSource.token,
        })
        .then((response) => {
          const result = response.data;
          if (result.count) {
            this.setResult({ result: result });
            this.setTimeoutID({
              timeoutID: setTimeout(
                () => this.search({ term }),
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

class InvalidStopIDError extends Error {
  name = "Bad Stop ID";
  stopIDs: string[];

  constructor(stopIDs: string[]) {
    const ess = stopIDs.length === 1 ? "" : "s";
    const verb = stopIDs.length === 1 ? "is" : "are";
    const string = stopIDs.join(", ");
    const message = `The following stop ID${ess} ${verb} not valid: ${string}`;
    super(message);
    this.stopIDs = stopIDs;
  }
}
