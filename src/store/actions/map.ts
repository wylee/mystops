import { unlistenAll, unlistenByKey } from 'ol/events';

import { DEFAULT_STATE } from '../reducers/map';
import { setSearchError } from './search';

export const SET_MAP_STATE = 'SET_MAP_STATE';
export const SET_BASE_LAYER = 'SET_BASE_LAYER';
export const SET_CENTER = 'SET_CENTER';
export const SET_EXTENT = 'SET_EXTENT';
export const SET_MAP_CONTEXT_MENU_STATE = 'SET_MAP_CONTEXT_MENU_STATE';
export const SET_ZOOM = 'SET_ZOOM';
export const SET_USER_LOCATION = 'SET_USER_LOCATION';
export const ZOOM_IN = 'ZOOM_IN';
export const ZOOM_OUT = 'ZOOM_OUT';

export function setMapState(state = {}) {
  return {
    type: SET_MAP_STATE,
    state,
  };
}

export function setBaseLayer(label) {
  return {
    type: SET_BASE_LAYER,
    baseLayer: label,
  };
}

export function setCenter(...args) {
  return (dispatch, getState) => {
    const { map } = getState().map;
    return map.setCenter(...args);
  };
}

export function setExtent(...args) {
  return (dispatch, getState) => {
    const { map } = getState().map;
    return map.fitExtent(...args);
  };
}

export function zoomIn() {
  return (dispatch, getState) => {
    const { map } = getState().map;
    return map.zoomIn();
  };
}

export function zoomOut() {
  return (dispatch, getState) => {
    const { map } = getState().map;
    return map.zoomOut();
  };
}

export function zoomToFullExtent() {
  return (dispatch, getState) => {
    const { map } = getState().map;
    const { center, zoom } = DEFAULT_STATE;
    return map.setCenter(center, zoom);
  };
}

export function setMapContextMenuState(open, top?, left?) {
  return {
    type: SET_MAP_CONTEXT_MENU_STATE,
    contextMenu: { open, top, left },
  };
}

export function setUserLocation(data) {
  return {
    type: SET_USER_LOCATION,
    userLocation: {
      ...data,
    },
  };
}

export function trackUserLocation() {
  return (dispatch, getState) => {
    const { map } = getState().map;
    const geolocator = map.geolocator;

    unlistenAll(geolocator);

    geolocator.on('error', error => {
      let errorMessage;

      switch (error.code) {
        case 1:
          errorMessage =
            'Access to location services have been blocked for this site.';
          break;
        case 3:
          errorMessage = 'Could not find location after 30 seconds.';
          break;
        default:
          errorMessage = 'Could not determine location.';
      }

      dispatch(
        setUserLocation({
          position: null,
          accuracy: Infinity,
          heading: null,
          error: errorMessage,
        })
      );
    });

    geolocator.on('change', () => {
      const position = geolocator.getPosition();
      const accuracy = geolocator.getAccuracy();
      const heading = geolocator.getHeading() || 0;
      dispatch(setUserLocation({ position, accuracy, heading, error: null }));
    });
  };
}

let geolocatorListenerKey;

export function zoomToUserLocation(zoom = 18) {
  unlistenByKey(geolocatorListenerKey);

  return (dispatch, getState) => {
    const {
      map,
      center,
      zoom: currentZoom,
      userLocation: { position, error },
    } = getState().map;

    if (error) {
      dispatch(setSearchError(error));
    } else if (position) {
      dispatch(setCenter(position, currentZoom >= zoom ? undefined : zoom));
    } else {
      geolocatorListenerKey = map.geolocator.once('change', () => {
        const { center: newCenter, zoom: newZoom } = getState().map;
        if (
          center[0] === newCenter[0] &&
          center[1] === newCenter[1] &&
          currentZoom === newZoom
        ) {
          dispatch(zoomToUserLocation(zoom));
        }
      });
    }
  };
}
