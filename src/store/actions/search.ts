import axios from 'axios';

import {
  decProgressCounter,
  incProgressCounter,
  setExtent,
  setActiveStops,
} from './index';

import { FEATURE_LAYER_MAX_RESOLUTION } from '../../map';
import { getExtentOfCoordinates } from '../../map/utils';

export const SET_SEARCH_STATE = 'SET_SEARCH_STATE';
export const RESET_SEARCH_STATE = 'RESET_SEARCH_STATE';
export const SET_SEARCH_TERM = 'SET_SEARCH_TERM';
export const SET_SEARCH_ERROR = 'SET_SEARCH_ERROR';

const API_URL = process.env.REACT_APP_API_URL;
const ARRIVALS_URL = `${API_URL}/arrivals`;
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export function doSearch(suppressErrors = false) {
  return (dispatch, getState) => {
    const { map } = getState().map;
    const { term } = getState().search;

    if (!term.trim()) {
      return dispatch(resetSearchState());
    }

    const params = { q: term };
    const canceler = axios.CancelToken.source();

    dispatch(resetSearchState({ term, canceler }));
    dispatch(incProgressCounter());

    return axios
      .get(ARRIVALS_URL, { params, cancelToken: canceler.token })
      .then(response => {
        const result = response.data;
        if (result.count) {
          const activeStops = result.stops.map(stop => stop.id);
          const coordinates = result.stops.map(stop => stop.coordinates);
          const newExtent = getExtentOfCoordinates(coordinates, false);

          // This forces zooming in when the map is zoomed out to the
          // point where the stop feature layer isn't visible, even if
          // the new extent is fully visible in the current map view.
          const bypassIfVisible = !(
            map.getResolution() >= FEATURE_LAYER_MAX_RESOLUTION
          );

          dispatch(
            setExtent(newExtent, true, undefined, undefined, bypassIfVisible)
          ).then(() => {
            dispatch(setActiveStops(activeStops));
            dispatch(
              setSearchState({
                result,
                timeoutID: setTimeout(
                  () => dispatch(doSearch()),
                  REFRESH_INTERVAL
                ),
              })
            );
          });
        }
      })
      .catch(error => {
        clearTimeout(getState().search.timeoutID);

        if (axios.isCancel(error)) {
          return;
        }

        if (error.response) {
          if (!suppressErrors) {
            const data = error.response.data;
            dispatch(setSearchError(data.error));
          }
        } else if (error.request) {
          dispatch(
            setSearchError({
              title: 'Error',
              message: 'Unable to get arrivals at this time',
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
}

export function setSearchState(state = {}) {
  return {
    type: SET_SEARCH_STATE,
    state,
  };
}

export function resetSearchState(state = {}) {
  return {
    type: RESET_SEARCH_STATE,
    state,
  };
}

export function setSearchTerm(term) {
  return {
    type: SET_SEARCH_TERM,
    term,
  };
}

export function setSearchError(error) {
  if (typeof error === 'string') {
    error = { message: error };
  }
  return {
    type: SET_SEARCH_ERROR,
    error,
  };
}
