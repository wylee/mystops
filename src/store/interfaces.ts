import { CancelTokenSource } from 'axios';

export interface IState {
  main: IMainState;
  map: IMapState;
  search: ISearchState;
}

/* Main */

export interface IMainState {
  activeStops: Array<number>;
  menuOpen: boolean;
  progressCounter: number;
  bottomSheet: {
    content: any;
  };
}

/* Map */

export interface IUserLocationState {
  position: Array<number>;
  accuracy: number;
  heading: number;
  error?: string;
}

export interface IMapContextMenuState {
  open: boolean;
  top: number;
  left: number;
}

export interface IMapState {
  baseLayer: string;
  nextBaseLayer: string;
  center: Array<number>;
  extent: Array<number>;
  resolution: number;
  zoom: number;
  userLocation?: IUserLocationState;
  contextMenu: IMapContextMenuState;
}

/* Search */

export interface ISearchError {
  title: string;
  message: string;
  detail?: string;
}

export interface ISearchState {
  term: string;
  error: ISearchError | null;
  result: Array<any> | null;
  timestamp: number | null;
  timeoutID: number | null;
  canceler: CancelTokenSource | null;
}
