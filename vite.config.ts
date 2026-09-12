import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { seoPlugin } from "./vite/seo";
import { apiDevPlugin } from "./vite/api-dev";

// Vite is tuned for modern browsers and fast dev workflows.
// The "@" alias keeps imports clean and refactor-friendly across the app.
export default defineConfig({
  // apiDevPlugin serves the api/ functions in `npm run dev` only; in the
  // cloud Vercel runs them itself.
  plugins: [react(), seoPlugin(), apiDevPlugin()],
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
