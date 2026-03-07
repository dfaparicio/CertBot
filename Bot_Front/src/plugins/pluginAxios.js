import axios from "axios";
import { useAuthStore } from "../store/auth.js";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://nodemongo-ihx8.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Interceptor de Peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers["x-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Interceptor de Respuestas (Limpio y seguro)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.token = "";
      authStore.user = null;
      // router.push('/login');
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;