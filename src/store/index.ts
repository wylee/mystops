import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import appReducer from './reducers';

const store = createStore(appReducer, applyMiddleware(thunkMiddleware));

export default store;
export * from './actions';
export * from './interfaces';
export * from './reducers';
