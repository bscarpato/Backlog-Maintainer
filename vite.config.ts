import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "renderer",
  server: {
    /** Garante que http://127.0.0.1:5174 responda (evita wait-on/Electron presos em IPv6 só ::1). */
    host: "127.0.0.1",
    port: 5174,
    strictPort: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "renderer/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
