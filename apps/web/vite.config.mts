import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    wasm(),
    topLevelAwait(),
  ],
  optimizeDeps: {
    exclude: ["@resvg/resvg-js"],
  },
  ssr: {
    external: ["@resvg/resvg-js"],
  },
});
