import './polyfills';

import axios from 'axios';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import registerServiceWorker from './registerServiceWorker';

import store from './store';
import App from './App';

import 'material-design-icons/iconfont/material-icons.css';
import './index.css';

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.validateStatus = status => status >= 200 && status < 400;

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);

registerServiceWorker();
