import "./polyfills";

import axios from "axios";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { store } from "./store";
import App from "./App";

import "material-design-icons/iconfont/material-icons.css";
import "./index.scss";

axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.validateStatus = (status) => status >= 200 && status < 400;

const main = () => {
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );
};

export default main;
