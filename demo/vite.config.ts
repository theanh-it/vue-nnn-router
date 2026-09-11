import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  vueNnnRouterNamesPlugin,
  vueNnnRouterScrollPlugin,
} from "../src/vitePlugin";

const demoDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    vueNnnRouterNamesPlugin({
      pages: [
        "src/pages/**/*.{vue,tsx,jsx,ts,js}",
        "src/pages/**/_middleware.ts",
        "src/pages/**/_redirect.ts",
      ],
      routesRoot: "src/pages",
      outFile: "src/router/router-name.ts",
      silent: true,
    }) as import("vite").PluginOption,
    vueNnnRouterScrollPlugin({
      pages: ["src/pages/**/*.{vue,tsx,jsx}"],
      outFile: "src/router/router-scroll.ts",
      silent: true,
    }) as import("vite").PluginOption,
  ],
  resolve: {
    alias: [
      /** Trỏ vào source gốc — không bắt buộc `npm run build` ở thư mục cha để dev. */
      {
        find: "vue-nnn-router/progress",
        replacement: resolve(demoDir, "../src/progress.ts"),
      },
      {
        find: "vue-nnn-router/smooth-scroll",
        replacement: resolve(demoDir, "../src/smoothScroll.ts"),
      },
      {
        find: "vue-nnn-router/vite",
        replacement: resolve(demoDir, "../src/vitePlugin.ts"),
      },
      {
        find: "vue-nnn-router",
        replacement: resolve(demoDir, "../src/index.ts"),
      },
    ],
  },
  // server: {
  //   port: 5174,
  //   strictPort: true,
  // },
});
