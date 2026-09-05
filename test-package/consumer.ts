import {
  createNnnProgress,
  createNnnRoutes,
  type NnnProgressOptions,
} from "vue-nnn-router";
import {
  vueNnnRouterNamesPlugin,
  vueNnnRouterScrollPlugin,
  type VueNnnRouterNamesPluginOptions,
  type VueNnnRouterScrollPluginOptions,
} from "vue-nnn-router/vite";

const namesOptions = {
  pages: [
    "src/pages/**/*.{vue,tsx,jsx,ts,js}",
    "src/pages/**/_middleware.ts",
    "src/pages/**/_redirect.ts",
  ],
  routesRoot: "src/pages",
  outFile: "src/constants/router-name.ts",
} satisfies VueNnnRouterNamesPluginOptions;

const scrollOptions = {
  pages: "src/pages/**/*.{vue,tsx,jsx}",
} satisfies VueNnnRouterScrollPluginOptions;

const progressOptions = {
  enabled: true,
  delay: 120,
} satisfies NnnProgressOptions;

void createNnnRoutes;
void createNnnProgress;
void progressOptions;
void vueNnnRouterNamesPlugin(namesOptions);
void vueNnnRouterScrollPlugin(scrollOptions);
