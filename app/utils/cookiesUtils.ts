import { jwtDecode } from "jwt-decode";
// Helper function to set cookies with expiration from JWT token

// Helper function to set cookies with expiration from JWT token
export const setCookieWithExpiration = (
  name: string,
  value: string,
  token: string
) => {
  try {
    // Giải mã token và lấy thời gian hết hạn (exp) từ payload
    const decodedToken: any = jwtDecode(token);
    const expiresAt = decodedToken.exp * 1000; // exp is in seconds, convert to milliseconds

    if (typeof document !== "undefined") {
      // Lưu cookie với thời gian hết hạn tính toán từ token
      document.cookie = `${name}=${value}; path=/; expires=${new Date(
        expiresAt
      ).toUTCString()}; SameSite=Lax; ${
        location.protocol === "https:" ? "Secure" : ""
      }`;
    }
  } catch (error) {
    // If token is not JWT or no exp, set cookie without expiration or with long expiration
    if (typeof document !== "undefined") {
      const shortExpiry = new Date();
      document.cookie = `${name}=${value}; path=/; expires=${shortExpiry.toUTCString()}; SameSite=Lax; ${
        location.protocol === "https:" ? "Secure" : ""
      }`;
    }
  }
};

// Helper function to get cookies
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;

  return null;
};

// Helper function to delete cookies
export const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

// Helper function to check if token is expired and clear cookie if necessary
export const checkTokenExpirationAndClear = () => {
  const token = getCookie("accessToken");

  if (token) {
    try {
      const decodedToken: any = jwtDecode(token);
      const expiresAt = decodedToken.exp * 1000; // Expiration time in milliseconds
      const currentTime = Date.now();

      // If token is expired, clear it
      if (expiresAt < currentTime) {
        deleteCookie("accessToken");
        console.log("Token has expired and has been removed.");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }
};
