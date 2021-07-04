import { createApp } from "vue";

import axios from "axios";

import App from "./ui/App.vue";
import router from "./ui/router";
import { store, key } from "./ui/store";

import "material-design-icons/iconfont/material-icons.css";
import "./ui/assets/global.scss";

axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.validateStatus = (status) => status >= 200 && status < 400;

createApp(App).use(store, key).use(router).mount("#root");
