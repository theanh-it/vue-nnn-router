import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vueNnnRouterNamesPlugin } from "../src/vitePlugin";

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
  ],
  resolve: {
    alias: {
      /** Trỏ vào source gốc — không bắt buộc `npm run build` ở thư mục cha để dev. */
      "vue-nnn-router": resolve(demoDir, "../src/index.ts"),
      "vue-nnn-router/vite": resolve(demoDir, "../src/vitePlugin.ts"),
    },
  },
  // server: {
  //   port: 5174,
  //   strictPort: true,
  // },
});
