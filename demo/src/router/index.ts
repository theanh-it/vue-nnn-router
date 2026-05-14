import { createRouter, createWebHistory } from "vue-router";
import { createNnnRoutes } from "vue-nnn-router";

/** Glob neo theo root Vite (demo/): `/...` không phụ thuộc vị trí file router. */
const modules = import.meta.glob(
  [
    "/src/pages/**/*.{vue,tsx,jsx,ts,js}",
    "/src/pages/**/_middleware.ts",
  ],
  { eager: true }
);

const routes = createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  verbose: import.meta.env.DEV,
  silent: false,
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
