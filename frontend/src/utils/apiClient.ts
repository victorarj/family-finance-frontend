import axios from "axios";
import { clearClientSession } from "./session";
import { STORAGE_KEYS } from "./storage";

export const AUTH_EXPIRED_EVENT = "auth:session-expired";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedBaseUrl = rawBaseUrl?.trim().replace(/\/+$/, "");

const client = axios.create({
  // In production (Render static site), set VITE_API_BASE_URL to your backend URL.
  // In local dev, fallback to Vite proxy at /api.
  baseURL: normalizedBaseUrl || "/api",
  headers: {
    Accept: "application/json; charset=utf-8",
  },
});

// request interceptor to add Authorization header if token present
client.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase() || "";
  const isMutationRequest = ["post", "put", "patch"].includes(method);
  const isFormDataPayload =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  const currentContentType = config.headers?.["Content-Type"] || config.headers?.["content-type"];

  if (config.headers && isMutationRequest && !isFormDataPayload && !currentContentType) {
    config.headers["Content-Type"] = "application/json; charset=utf-8";
  }
  const token = localStorage.getItem(STORAGE_KEYS.token);
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
      const hadToken = Boolean(localStorage.getItem(STORAGE_KEYS.token));
      clearClientSession();
      if (hadToken) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

export default client;
