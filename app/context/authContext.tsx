"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useApi } from "../hooks/useApi";
import { client } from "../utils/apiClient";
import {
  setCookieWithExpiration,
  getCookie,
  deleteCookie,
} from "../utils/cookiesUtils";

// Định nghĩa kiểu dữ liệu của người dùng
interface User {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "user";
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<any>;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider để cung cấp context cho các component con
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { post, get } = useApi();

  // Flag to ensure interceptor is added only once
  const interceptorAdded = React.useRef(false);

  // Lấy thông tin người dùng
  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await get("/accounts/profile");
      if (response.success) {
        setUser(response.user);
        setError(null);
      } else {
        setUser(null);
        setError("Unable to load user profile.");
      }
    } catch (error: any) {
      console.error("Failed to load user information", error);
      setError("Failed to load user information.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = getCookie("refreshToken");
    if (!refreshToken) {
      setError("No refresh token. Please sign in again.");
      setUser(null);
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      return false;
    }

    try {
      const response = await post("/accounts/refresh-token", { refreshToken });
      if (response.success && response.accessToken) {
        setCookieWithExpiration(
          "accessToken",
          response.accessToken,
          response.accessToken
        );
        return true;
      } else {
        setError(response.message || "Failed to refresh token.");
        setUser(null);
        deleteCookie("accessToken");
        deleteCookie("refreshToken");
        return false;
      }
    } catch (error: any) {
      setError("Failed to refresh token.");
      console.error("Refresh token error:", error);
      setUser(null);
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      return false;
    }
  };

  // Kiểm tra token và refresh user
  useEffect(() => {
    // checkTokenExpirationAndClear(); // Disable để test refresh
    const token = getCookie("accessToken");

    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }

    // Add response interceptor for token refresh
    if (!interceptorAdded.current) {
      client.interceptors.response.use(
        (response) => response,
        async (error) => {
          if (error.response?.status === 401) {
            const success = await refreshAccessToken();
            if (success) {
              // Retry the original request
              const originalRequest = error.config;
              originalRequest.headers["Authorization"] = `Bearer ${getCookie(
                "accessToken"
              )}`;
              return client(originalRequest);
            }
          }
          return Promise.reject(error);
        }
      );
      interceptorAdded.current = true;
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const response = await post("/accounts/login", { email, password });
      if (response.success && response.accessToken && response.refreshToken) {
        // Lưu token vào cookie với thời gian hết hạn
        setCookieWithExpiration(
          "accessToken",
          response.accessToken,
          response.accessToken
        );
        setCookieWithExpiration(
          "refreshToken",
          response.refreshToken,
          response.refreshToken
        );

        await fetchUser();
        return true;
      } else {
        setError(response.message || "Sign-in failed.");
        return false;
      }
    } catch (error: any) {
      setError(
        error.response?.message || "Sign-in failed. Please try again."
      );
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    phone: string,
    password: string
  ): Promise<any> => {
    setError(null);
    setLoading(true);
    try {
      const response = await post("/accounts/register", {
        fullName,
        email,
        phone,
        password,
      });
      if (response.success) {
        return response;
      } else {
        setError(response.message || "Registration failed.");
        return response.message;
      }
    } catch (error: any) {
      setError(
        error.response?.message || "Registration failed. Please try again."
      );
      console.error("Register error:", error);
      return error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await post("/accounts/logout");
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      setUser(null);
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to access Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
