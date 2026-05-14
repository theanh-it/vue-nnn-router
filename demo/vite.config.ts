import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      /** Trỏ vào source gốc — không bắt buộc `npm run build` ở thư mục cha để dev. */
      "vue-nnn-router": resolve(demoDir, "../src/index.ts"),
    },
  },
  // server: {
  //   port: 5174,
  //   strictPort: true,
  // },
});
