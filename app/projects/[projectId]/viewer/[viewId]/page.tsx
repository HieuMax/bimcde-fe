"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Đảm bảo đường dẫn import đúng file bạn lưu component DetailView2D
import DetailView2D from "@/components/features/view2DManagement/viewHome";
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";

export default function Page() {
  const params = useParams() as { projectId: string; viewId: string };
  const router = useRouter();

  const [fileName, setFileName] = useState<string>("Đang tải...");

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== TOP TOOLBAR ===== */}
      <DetailToolbar
        name={fileName}
        onBack={() => {
          router.push(`/projects/${params.projectId}/data`);
        }}
        onDownload={() => {
          console.log("Download clicked");
        }}
      />

      {/* ===== 2D MANAGEMENT ===== */}
      <div className="flex-1 overflow-hidden relative">
        <DetailView2D
          mode="view"
          fileId={params.viewId}
          onLoaded={(file) => setFileName(file.name)}
        />
      </div>
    </div>
  );
}
