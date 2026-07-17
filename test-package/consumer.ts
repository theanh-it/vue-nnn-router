import { createNnnRoutes } from "vue-nnn-router";
import {
  vueNnnRouterNamesPlugin,
  type VueNnnRouterNamesPluginOptions,
} from "vue-nnn-router/vite";

const options = {
  pages: "src/pages/**/*.vue",
  routesRoot: "src/pages",
} satisfies VueNnnRouterNamesPluginOptions;

void createNnnRoutes;
void vueNnnRouterNamesPlugin(options);
