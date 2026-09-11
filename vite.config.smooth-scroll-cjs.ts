import { defineConfig } from "vite";
import { resolve } from "node:path";

/**
 * CJS smooth-scroll entry. Lenis is bundled because Node 18/20 cannot load
 * Lenis's ESM-only package through an external `require("lenis")`.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/smoothScroll.ts"),
      name: "VueNnnRouterSmoothScroll",
      formats: ["cjs"],
      fileName: () => "smooth-scroll.cjs",
    },
    rollupOptions: {
      external: ["vue-router"],
    },
    sourcemap: true,
    target: "es2022",
    emptyOutDir: false,
  },
});
