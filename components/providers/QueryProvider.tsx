"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data được coi là "tươi" trong 1 phút (không fetch lại khi switch tab/focus)
            staleTime: 60 * 1000,
            // Không tự động fetch lại khi cửa sổ trình duyệt được focus (tránh spam server)
            refetchOnWindowFocus: false,
            // Thử lại 1 lần nếu lỗi mạng
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
