export interface AppState {
  selectedStops: Stop[];
  deselectedStops: Stop[];
  term?: string;
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
