export * from './map';
export * from './search';

export const SET_ACTIVE_STOPS = 'SET_ACTIVE_STOPS';
export const SET_BOTTOM_SHEET_CONTENT = 'SET_BOTTOM_SHEET_CONTENT';
export const SET_MENU_STATE = 'SET_MENU_STATE';
export const INC_PROGRESS_COUNTER = 'INC_PROGRESS_COUNTER';
export const DEC_PROGRESS_COUNTER = 'DEC_PROGRESS_COUNTER';

export function setActiveStops(stops) {
  return {
    type: SET_ACTIVE_STOPS,
    stops,
  };
}

export function setMenuState(open) {
  return {
    type: SET_MENU_STATE,
    open,
  };
}

export function setBottomSheetContent(content) {
  return {
    type: SET_BOTTOM_SHEET_CONTENT,
    content,
  };
}

export function incProgressCounter() {
  return {
    type: INC_PROGRESS_COUNTER,
  };
}

export function decProgressCounter() {
  return {
    type: DEC_PROGRESS_COUNTER,
  };
}
