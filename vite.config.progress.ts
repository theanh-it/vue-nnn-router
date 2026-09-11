import { defineConfig } from "vite";
import { resolve } from "node:path";

/** Optional navigation progress UI entry. Root export remains for compatibility. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/progress.ts"),
      name: "VueNnnRouterProgress",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es" ? "progress.js" : "progress.cjs",
    },
    rollupOptions: {
      external: ["vue-router"],
    },
    sourcemap: true,
    target: "es2022",
    emptyOutDir: false,
  },
});
