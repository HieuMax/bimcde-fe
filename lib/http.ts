import axios from "axios";

// URL Backend Express của bạn
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const http = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Timeout sau 30s
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor Request: Tự động gắn Token vào Header
http.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Giả sử bạn lưu token ở localStorage tên là 'accessToken'
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Xử lý lỗi chung (VD: Token hết hạn 401)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic logout hoặc refresh token ở đây
      console.error("Unauthorized! Redirecting to login...");
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
