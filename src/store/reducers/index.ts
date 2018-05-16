import { combineReducers } from 'redux';

import {
  SET_ACTIVE_STOPS,
  SET_BOTTOM_SHEET_CONTENT,
  SET_MENU_STATE,
  INC_PROGRESS_COUNTER,
  DEC_PROGRESS_COUNTER,
} from '../actions';

import map from './map';
import search from './search';

export const DEFAULT_STATE = {
  activeStops: [],
  bottomSheet: {
    content: null,
  },
  menuOpen: false,
  progressCounter: 0,
};

function main(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case SET_ACTIVE_STOPS:
      return {
        ...state,
        activeStops: action.stops,
      };
    case SET_BOTTOM_SHEET_CONTENT:
      return {
        ...state,
        bottomSheet: {
          content: action.content,
        },
      };
    case SET_MENU_STATE:
      const menuOpen =
        typeof action.open === 'undefined' ? !state.menuOpen : action.open;
      return {
        ...state,
        menuOpen,
      };
    case INC_PROGRESS_COUNTER:
      return {
        ...state,
        progressCounter: state.progressCounter + 1,
      };
    case DEC_PROGRESS_COUNTER:
      return {
        ...state,
        progressCounter: state.progressCounter - 1,
      };
    default:
      return state;
  }
}

export default combineReducers({ main, map, search });
