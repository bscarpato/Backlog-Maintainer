import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "renderer/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    // Database tests run in Node environment (no DOM needed)
    environmentMatchGlobs: [["tests/unit/database/**", "node"]],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Prevent parallel runs from sharing the module-level SQLite connection
    pool: "forks"
  }
});
