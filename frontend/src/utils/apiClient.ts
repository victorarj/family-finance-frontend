import axios from "axios";

const client = axios.create({ baseURL: "/api" });

// request interceptor to add Authorization header if token present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
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
