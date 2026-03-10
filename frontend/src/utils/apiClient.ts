import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedBaseUrl = rawBaseUrl?.trim().replace(/\/+$/, "");

const client = axios.create({
  // In production (Render static site), set VITE_API_BASE_URL to your backend URL.
  // In local dev, fallback to Vite proxy at /api.
  baseURL: normalizedBaseUrl || "/api",
});

// request interceptor to add Authorization header if token present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (config.method?.toLowerCase() === "get" && config.headers) {
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers.Pragma = "no-cache";
    config.headers.Expires = "0";
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // clear stale auth data; optional redirect
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
