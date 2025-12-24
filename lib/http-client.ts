const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | undefined | null>;
};

// Hàm helper để nối params vào URL
const buildUrl = (endpoint: string, params?: FetchOptions["params"]) => {
  const url = new URL(
    endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

// Hàm core xử lý fetch
async function request<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data: T; headers: Headers }> {
  const { params, headers, ...customConfig } = options;

  // 1. Tự động lấy Token từ localStorage (Client-side only)
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Merge headers (ưu tiên headers truyền vào)
  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers, // Nếu headers có 'Content-Type': undefined (cho FormData) -> nó sẽ override
    },
  };

  // Nếu body là FormData, trình duyệt tự set Content-Type boundary -> Xóa Content-Type mặc định
  if (config.body instanceof FormData) {
    // @ts-expect-error -- headers can be HeadersInit, need runtime delete
    delete config.headers["Content-Type"];
  }

  const response = await fetch(buildUrl(endpoint, params), config);

  // 2. Xử lý lỗi HTTP (4xx, 5xx)
  if (!response.ok) {
    if (response.status === 401) {
      console.error("Unauthorized! Redirecting...");
      // window.location.href = '/login';
    }

    // Cố gắng parse lỗi JSON từ server
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      /* ignore if not json */
    }

    throw new Error(errorMessage);
  }

  // 3. Xử lý Response
  // Nếu server trả về Blob (cho download)
  const contentType = response.headers.get("content-type");
  if (
    contentType &&
    (contentType.includes("application/zip") ||
      contentType.includes("application/octet-stream") ||
      contentType.startsWith("image/") || // ⭐ FIX PNG / JPG
      contentType.includes("pdf")) // ⭐ optional
  ) {
    // Trick: Đánh dấu để trả về blob
    const blob = await response.blob();
    return { data: blob as unknown as T, headers: response.headers };
  }

  // Default: JSON
  // Kiểm tra nếu response body rỗng (204 No Content)
  if (response.status === 204) {
    return { data: {} as T, headers: response.headers };
  }

  const data = await response.json();
  return { data, headers: response.headers };
}

// Wrapper object giống Axios
export const httpClient = {
  get: <T>(url: string, options?: FetchOptions) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: unknown, options?: FetchOptions) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown, options?: FetchOptions) =>
    request<T>(url, { ...options, method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(url: string, options?: FetchOptions & { data?: unknown }) =>
    request<T>(url, {
      ...options,
      method: "DELETE",
      body: options?.data ? JSON.stringify(options.data) : undefined,
    }),
};
