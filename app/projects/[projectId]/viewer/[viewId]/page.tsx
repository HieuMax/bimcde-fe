"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Đảm bảo đường dẫn import đúng file bạn lưu component DetailView2D
const DetailView2D = dynamic(
  () => import("@/components/features/view2DManagement/viewHome"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-gray-500">
        Loading Viewer...
      </div>
    ),
  }
);
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";
import { ToolType } from "@/types/explorer";

export default function Page() {
  const params = useParams() as { projectId: string; viewId: string };
  const router = useRouter();

  const [fileName, setFileName] = useState<string>("Đang tải...");
  const [activeTool, setActiveTool] = useState<ToolType>("cursor");
  return (
    <div className=" flex-none z-50">
      {/* ===== TOP TOOLBAR ===== */}
      <DetailToolbar
        name={fileName}
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        onBack={() => {
          router.push(`/projects/${params.projectId}/data`);
        }}
        onDownload={() => {
          console.log("Download clicked");
        }}
      />

      {/* ===== 2D MANAGEMENT ===== */}
      <div className="flex-1 w-screen h-screen relative overflow-hidden">
        <DetailView2D
          mode="view"
          fileId={params.viewId}
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          onLoaded={(file) => setFileName(file.name)}
        />
      </div>
    </div>
  );
}
