"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { explorerService } from "@/services/explorer.service";

export default function ShareResolvePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  useEffect(() => {
    async function resolve() {
      try {
        const res = await explorerService.getFileByShare(token);

        // ✅ redirect CHUẨN
        router.replace(
          `/projects/${res.projectId}/viewer/${res.fileId}?shareToken=${token}`
        );
      } catch (err) {
        console.error("Invalid share token", err);
        router.replace("/404");
      }
    }

    if (token) resolve();
  }, [token]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Opening shared document…
    </div>
  );
}

// bimcde-fe\app\share\[token]\page.tsx