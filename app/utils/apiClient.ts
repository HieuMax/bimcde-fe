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

// Response interceptor will be added in authContext
