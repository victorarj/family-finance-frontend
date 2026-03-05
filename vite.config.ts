import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "frontend",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.ts?(x)"],
    restoreMocks: true,
    clearMocks: true,
  },
  server: {
    proxy: {
      // forward API requests to backend dev server to avoid CORS
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        // remove the `/api` prefix when forwarding to the backend
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
