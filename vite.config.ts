import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== "true",
    port: 5173,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || false,
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
});
