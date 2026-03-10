import axios from "axios";
import { useMainStore } from "../store/store.js";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Interceptor para peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const store = useMainStore();
    const token = store.token;
    if (token) {
      config.headers["x-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const store = useMainStore();
      store.logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
