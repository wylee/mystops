import {
  SET_SEARCH_STATE,
  RESET_SEARCH_STATE,
  SET_SEARCH_TERM,
  SET_SEARCH_ERROR,
} from '../actions/search';

import { ISearchState } from '../interfaces';

export const DEFAULT_STATE = {
  term: '',
  error: null,
  result: null,
  timestamp: null,
  timeoutID: null,
  canceler: null,
};

export default function reducer(state: ISearchState = DEFAULT_STATE, action) {
  switch (action.type) {
    case SET_SEARCH_STATE:
      return {
        ...state,
        ...action.state,
      };
    case RESET_SEARCH_STATE:
      if (state.canceler) {
        state.canceler.cancel();
      }
      if (state.timeoutID) {
        clearTimeout(state.timeoutID);
      }
      return {
        ...DEFAULT_STATE,
        ...action.state,
      };
    case SET_SEARCH_TERM:
      return {
        ...state,
        term: action.term,
      };
    case SET_SEARCH_ERROR:
      return {
        ...state,
        error: action.error,
      };
    default:
      return state;
  }
}
