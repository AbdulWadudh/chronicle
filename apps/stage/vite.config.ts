import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(projectRoot, "../..");
const directorTarget = process.env.VITE_DIRECTOR_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "~": resolve(projectRoot, "src") },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 8082,
    strictPort: true,
    fs: { allow: [workspaceRoot] },
    proxy: {
      "/api": { target: directorTarget, changeOrigin: true, ws: true },
      "/health": { target: directorTarget, changeOrigin: true },
    },
  },
  build: { target: "es2022" },
  optimizeDeps: { exclude: ["@chronicle/utils", "@chronicle/config"] },
});
