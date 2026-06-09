import { createRouter, createWebHistory } from "vue-router";
import { createNnnModules, createNnnRoutes } from "vue-nnn-router";
export { ROUTER_NAME } from "./router-name";

/** Lazy pages/layouts; eager _middleware + _redirect (recommended split). */
const lazyViews = import.meta.glob("/src/pages/**/*.{vue,tsx,jsx}");

const eagerSidecars = import.meta.glob(
  ["/src/pages/**/_middleware.ts", "/src/pages/**/_redirect.ts"],
  { eager: true },
);

const modules = createNnnModules({
  views: lazyViews as Record<string, unknown>,
  eager: eagerSidecars as Record<string, unknown>,
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
});
