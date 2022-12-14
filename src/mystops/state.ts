import React from "react";

import { termToStopIds } from "./utils";

export interface State {
  menuOpen: boolean;
  term: string;
  result: Result | null;
  selectedStops: any[];
  deselectedStops: any[];
  error: Error | null;
  doArrivalsQuery: boolean;
}

export interface Result {
  count: number;
  updateTime: string;
  stops: Stop[];
}

export interface Stop {
  id: number;
  coordinates: number[];
  name: string;
  routes: Route[];
}

export interface Route {
  id: number;
  name: string;
  arrivals: Arrival[];
}

export interface Arrival {
  estimated: string | Date | null;
  scheduled: string | Date | null;
  status: string | null;
  distanceAway: {
    feet: number;
    miles: number;
    meters: number;
    kilometers: number;
  };
  designation: string | null;
}

export interface Error {
  title: string;
  explanation: string;
  detail?: string;
}

const INITIAL_STATE: State = {
  menuOpen: false,
  term: "",
  result: null,
  selectedStops: [],
  deselectedStops: [],
  error: null,
  doArrivalsQuery: false,
};

type ACTION =
  | "RESET"
  // Main Menu ---------------------------------------------------------
  | "TOGGLE_MENU"
  | "CLOSE_MENU"
  // Search ------------------------------------------------------------
  | "SET_TERM"
  | "TOGGLE_STOP"
  | "DO_ARRIVALS_QUERY"
  | "SET_RESULT"
  // Error -------------------------------------------------------------
  | "SET_ERROR"
  | "CLEAR_ERROR";

interface Action {
  type: ACTION;
  payload?: any;
}

function reducer(state: State, { type, payload }: Action): State {
  switch (type) {
    case "RESET": {
      return {
        ...INITIAL_STATE,
        deselectedStops: state.result?.stops ?? [],
      };
    }
    // Main Menu -------------------------------------------------------
    case "TOGGLE_MENU": {
      return { ...state, menuOpen: !state.menuOpen };
    }
    case "CLOSE_MENU": {
      return { ...state, menuOpen: false };
    }
    // Search ----------------------------------------------------------
    case "SET_TERM": {
      return { ...state, term: payload };
    }
    case "TOGGLE_STOP": {
      const stopId = payload;
      const selected = termToStopIds(state.term);
      const index = selected.indexOf(stopId);
      index === -1 ? selected.push(stopId) : selected.splice(index, 1);
      selected.sort((a, b) => a - b);
      if (selected.length === 0) {
        return { ...INITIAL_STATE, deselectedStops: state.result?.stops ?? [] };
      }
      return { ...state, term: selected.join(", ") };
    }
    case "DO_ARRIVALS_QUERY": {
      return { ...state, doArrivalsQuery: payload };
    }
    case "SET_RESULT": {
      const result = payload;
      return {
        ...state,
        result,
        selectedStops: result.stops,
        deselectedStops: state.result?.stops ?? [],
        error: null,
      };
    }
    // Error -----------------------------------------------------------
    case "SET_ERROR": {
      return {
        ...state,
        result: null,
        selectedStops: [],
        deselectedStops: state.result?.stops ?? [],
        error: payload,
        doArrivalsQuery: false,
      };
    }
    // Default ---------------------------------------------------------
    default: {
      throw new Error(`Unknown action: ${type}`);
    }
  }
}

export function useReducer() {
  return React.useReducer(reducer, INITIAL_STATE, undefined);
}

export const StateContext = React.createContext({
  state: INITIAL_STATE,
  dispatch: (action: Action): void => {
    throw new Error(
      `Attempted to perform action "${action}", but StateContext was not initialized.`
    );
  },
});

export function useStateContext() {
  return React.useContext(StateContext);
}
