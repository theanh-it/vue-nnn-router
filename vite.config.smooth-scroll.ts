import { defineConfig } from "vite";
import { resolve } from "node:path";

/** Optional Lenis integration — kept out of the core runtime bundle. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/smoothScroll.ts"),
      name: "VueNnnRouterSmoothScroll",
      formats: ["es"],
      fileName: () => "smooth-scroll.js",
    },
    rollupOptions: {
      external: ["lenis", "vue-router"],
    },
    sourcemap: true,
    target: "es2022",
    emptyOutDir: false,
  },
});
