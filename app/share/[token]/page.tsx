"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { explorerService } from "@/services/explorer.service";
import { Loader2 } from "lucide-react";

export default function ShareResolvePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolve() {
      try {
        if (!token) return;
        const res = await explorerService.getFileByShare(token);

        if (res && res.projectId && res.fileId) {
          const viewId = res.viewId ?? res.fileId;

          const targetUrl =
            `/projects/${res.projectId}/viewer/${viewId}?shareToken=${token}`;

          router.replace(targetUrl);
        } else {
          setError("Thông tin chia sẻ không hợp lệ.");
          }
        } catch (err) {
          console.error("Invalid share token", err);
          setError("Liên kết không tồn tại hoặc đã hết hạn.");
          setTimeout(() => router.replace("/login"), 3000);
        }
    }

    resolve();
  }, [token, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-red-500 gap-2">
        <p className="font-semibold">Lỗi truy cập</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500 gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p>Đang mở tài liệu được chia sẻ...</p>
    </div>
  );
}
// bimcde-fe\app\share\[token]\page.tsx