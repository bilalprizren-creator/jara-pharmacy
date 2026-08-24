import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { seoPlugin } from "./vite/seo";

// Vite is tuned for modern browsers and fast dev workflows.
// The "@" alias keeps imports clean and refactor-friendly across the app.
export default defineConfig({
  plugins: [react(), seoPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
