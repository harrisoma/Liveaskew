import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(root, "src/mobile"),
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  publicDir: resolve(root, "public"),
  server: {
    host: true,
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      input: resolve(root, "src/mobile/index.html"),
    },
  },
});
