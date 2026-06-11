// frontend/src/utils/api.js
import axios from "axios";

// Determine base URL dynamically:
// In dev, point to localhost:8000 (FastAPI port)
// In prod, target local origin directly
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const origin = window.location.origin;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://localhost:8000";
  }
  return origin;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Crucial for HTTP-Only Cookie passing
  headers: {
    "Content-Type": "application/json"
  }
});

// Response interceptor to handle auth failures globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local user storage if token expired / unauthorized
      localStorage.removeItem("user");
      // Only redirect to login if we are not on public survey page or login pages
      const path = window.location.pathname;
      if (!path.includes("/login") && !path.includes("/register") && !path.includes("/survey/public")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
