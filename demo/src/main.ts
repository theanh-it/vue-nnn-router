import { createApp } from "vue";
import "lenis/dist/lenis.css";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(router).mount("#app");
