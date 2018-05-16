import { BASE_LAYER_LABELS, MIN_ZOOM, MAX_ZOOM } from '../../map';

import {
  SET_MAP_STATE,
  SET_BASE_LAYER,
  SET_CENTER,
  SET_EXTENT,
  SET_MAP_CONTEXT_MENU_STATE,
  SET_USER_LOCATION,
  SET_ZOOM,
  ZOOM_IN,
  ZOOM_OUT,
} from '../actions/map';

export const DEFAULT_STATE = {
  baseLayer: BASE_LAYER_LABELS[0],
  nextBaseLayer: BASE_LAYER_LABELS[1],
  center: [-13655274.508685641, 5704240.981993447], // -122.667418, 45.523029
  extent: [0, 0, 0, 0],
  resolution: 0,
  zoom: process.env.REACT_APP_DEBUG ? 17 : 13,
  userLocation: {
    position: undefined,
    accuracy: Infinity,
    heading: 0,
    error: null,
  },
  contextMenu: {
    open: false,
    top: 0,
    left: 0,
  },
};

function constrainZoom(zoom) {
  if (zoom < MIN_ZOOM) {
    zoom = MIN_ZOOM;
  }
  if (zoom > MAX_ZOOM) {
    zoom = MAX_ZOOM;
  }
  return zoom;
}

export default function reducer(state = DEFAULT_STATE, action) {
  let zoom;
  switch (action.type) {
    case SET_MAP_STATE:
      action.zoom = constrainZoom(action.zoom);
      return {
        ...state,
        ...action.state,
      };
    case SET_BASE_LAYER:
      const baseLayer = action.baseLayer;
      const index =
        (BASE_LAYER_LABELS.indexOf(baseLayer) + 1) % BASE_LAYER_LABELS.length;
      const nextBaseLayer = BASE_LAYER_LABELS[index];
      return {
        ...state,
        baseLayer,
        nextBaseLayer,
      };
    case SET_CENTER:
      zoom = constrainZoom(action.zoom);
      return {
        ...state,
        center: action.center,
        zoom,
      };
    case SET_EXTENT:
      return {
        ...state,
        extent: action.extent,
      };
    case SET_USER_LOCATION:
      return {
        ...state,
        userLocation: {
          ...state.userLocation,
          ...action.userLocation,
        },
      };
    case SET_ZOOM:
      zoom = constrainZoom(action.zoom);
      return {
        ...state,
        zoom,
      };
    case ZOOM_IN:
      zoom = constrainZoom(state.zoom + 1);
      return {
        ...state,
        zoom,
      };
    case ZOOM_OUT:
      zoom = constrainZoom(state.zoom - 1);
      return {
        ...state,
        zoom,
      };
    case SET_MAP_CONTEXT_MENU_STATE:
      return {
        ...state,
        contextMenu: {
          open: action.contextMenu.open,
          top: action.contextMenu.top || state.contextMenu.top,
          left: action.contextMenu.left || state.contextMenu.left,
        },
      };
    default:
      return state;
  }
}
