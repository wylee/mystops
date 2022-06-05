import { createApp } from "vue";
import { createPinia } from "pinia";

import axios from "axios";

import App from "./ui/App.vue";
import router from "./ui/router";

import "material-design-icons/iconfont/material-icons.css";
import "./ui/assets/global.scss";

axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.validateStatus = (status) => status >= 200 && status < 400;

createApp(App).use(createPinia()).use(router).mount("#root");
