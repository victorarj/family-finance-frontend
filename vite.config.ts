import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:3000";

  return {
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
        "/api/v1": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // forward API requests to backend dev server to avoid CORS
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          // remove the `/api` prefix when forwarding to the backend
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
