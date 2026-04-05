export interface AppState {
  selectedStops: Stop[];
  deselectedStops: Stop[];
  term: string;
  result?: Result;
  error?: Error;
}

export interface Result {
  count: number;
  updateTime: string;
  stops: Stop[];
}

export interface Stop {
  id: number;
  name: string;
  coordinates: number[];
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

// Map -----------------------------------------------------------------

export interface ContextMenuState {
  x: number;
  y: number;
  open: boolean;
}

export interface StopInfo {
  id: number;
  name: string;
  direction: string | null;
  routes: Array<any>;
  position: Position;
}

export interface Position {
  top: string;
  right: string;
  bottom: string;
  left: string;
}
