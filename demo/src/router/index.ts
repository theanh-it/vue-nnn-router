import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnModules,
  createNnnProgress,
  createNnnRoutes,
  createNnnScrollBehavior,
} from "vue-nnn-router";
import { NNN_SCROLL } from "./router-scroll";
export { ROUTER_NAME } from "./router-name";

/** Lazy pages/layouts; eager _middleware + _redirect (recommended split). */
const lazyViews = import.meta.glob([
  "/src/pages/**/*.{vue,tsx,jsx}",
  "!/src/pages/users/add.vue",
]);

const eagerSidecars = import.meta.glob(
  ["/src/pages/**/_middleware.ts", "/src/pages/**/_redirect.ts"],
  { eager: true },
);

/** Page này export middleware riêng, nên phải eager để đọc được named export đó. */
const eagerRouteMiddleware = import.meta.glob("/src/pages/users/add.vue", {
  eager: true,
});

const modules = createNnnModules({
  views: lazyViews as Record<string, unknown>,
  eager: {
    ...(eagerSidecars as Record<string, unknown>),
    ...(eagerRouteMiddleware as Record<string, unknown>),
  },
  silent: !import.meta.env.DEV,
});

const routes = createNnnRoutes(modules, {
  routesRoot: "src/pages",
  verbose: import.meta.env.DEV,
  silent: false,
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: createNnnScrollBehavior({
    smooth: true,
    scrollMap: NNN_SCROLL,
  }),
});

const progress = createNnnProgress(router, {
  enabled: true,
  color: "green",
  height: 1,
  // Demo: hiện ngay; hoàn tất đúng lúc lazy navigation resolve xong.
  delay: 0,
  minimumVisible: 0,
});

if (import.meta.hot) import.meta.hot.dispose(() => progress.destroy());
