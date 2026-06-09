import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VueNnnRouter",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es" ? "vue-nnn-router.js" : "vue-nnn-router.cjs",
    },
    rollupOptions: {
      external: ["vue", "vue-router"],
    },
    sourcemap: true,
    target: "es2022",
    emptyOutDir: true,
  },
});
