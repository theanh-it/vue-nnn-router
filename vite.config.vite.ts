import { defineConfig } from "vite";
import { resolve } from "node:path";

/** Vite plugin entry (Node-only; bundles route generator). */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/vitePlugin.ts"),
      name: "VueNnnRouterVite",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "vite.js" : "vite.cjs"),
    },
    rollupOptions: {
      external: (id) =>
        id === "vite" || id === "tinyglobby" || id.startsWith("node:"),
    },
    sourcemap: true,
    target: "es2022",
    emptyOutDir: false,
  },
});
