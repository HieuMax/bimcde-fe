import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const client = axios.create({
  baseURL: API_URL
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
  return null;
}

client.interceptors.request.use((config) => {
  const token = getCookie("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

// Global response interceptor: show server error messages as toasts (client-side only).
// Auth-specific 401 handling is still done in `authContext`.
try {
  // Only attach in environments where `window` exists (avoid SSR).
  if (typeof window !== "undefined") {
    // Lazy import toast to avoid SSR import issues
    const { toast } = require("sonner");
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || error?.message;
        // Skip 401 here because authContext handles refresh/retry
        if (status !== 401 && msg) {
          try {
            toast.error(msg);
          } catch (e) {
            // swallow toast errors
          }
        }
        return Promise.reject(error);
      },
    );
  }
} catch (e) {
  // Fail silently if toast or interceptor setup isn't available
}
