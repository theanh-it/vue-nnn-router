import {
  createNnnProgress,
  createNnnRoutes,
  defineNnnSmoothScroll,
  type NnnProgressOptions,
  type NnnSmoothScrollMeta,
} from "vue-nnn-router";
import {
  createNnnProgress as createNnnProgressFromSubpath,
  type NnnProgressOptions as NnnProgressSubpathOptions,
} from "vue-nnn-router/progress";
import {
  createNnnSmoothScroll,
  type NnnSmoothScrollOptions,
} from "vue-nnn-router/smooth-scroll";
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

const scrollPluginOptions = {
  pages: "src/pages/**/*.{vue,tsx,jsx}",
} satisfies VueNnnRouterScrollPluginOptions;

const progressOptions = {
  enabled: true,
  delay: 120,
} satisfies NnnProgressOptions;

const progressSubpathOptions = {
  enabled: true,
} satisfies NnnProgressSubpathOptions;

const smoothScrollOptions = {
  disableOnMobile: true,
  mobileBreakpoint: 767,
  lenisOptions: { lerp: 0.1 },
} satisfies NnnSmoothScrollOptions;

const pageSmoothScroll = {
  enabled: true,
  disableOnMobile: true,
} satisfies NnnSmoothScrollMeta;

void createNnnRoutes;
void createNnnProgress;
void progressOptions;
void createNnnProgressFromSubpath;
void progressSubpathOptions;
void createNnnSmoothScroll;
void smoothScrollOptions;
void defineNnnSmoothScroll(pageSmoothScroll);
void vueNnnRouterNamesPlugin(namesOptions);
void vueNnnRouterScrollPlugin(scrollPluginOptions);
