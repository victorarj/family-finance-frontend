import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
