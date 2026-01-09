// bimcde-fe\app\projects\[projectId]\viewer\[viewId]\page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import DetailView2D from "@/components/features/view2DManagement/viewHome";
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";
import ShareFileDialog from "@/components/features/explorer/dialogs/ShareFileDialog";

export default function Page() {
  const params = useParams() as { projectId: string; viewId: string };
  const router = useRouter();

  const [fileName, setFileName] = useState("Đang tải...");
  const [fileData, setFileData] = useState<{ _id: string; name: string } | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`
        flex flex-col bg-white transition-all duration-300
        ${isFullscreen 
          ? 'fixed inset-0 z-100 h-screen w-screen'
          : 'flex-1 h-[calc(100vh-60px)] min-h-0 relative'
        }
      `}>
      {/* TOOLBAR DUY NHẤT */}
      <DetailToolbar
        name={fileName}
        onBack={() => router.push(`/projects/${params.projectId}/data`)}
        onShare={() => {
          if (!fileData) return;
          setIsShareOpen(true);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* VIEWER */}
      <div className="flex-1 overflow-hidden relative">
        <DetailView2D
          mode="view"
          fileId={params.viewId}
          onLoaded={(file) => {
            setFileName(file.name);
            setFileData({ _id: file._id, name: file.name }); 
          }}
        />
      </div>

      {/* SHARE POPUP */}
      <ShareFileDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        file={fileData}
      />
    </div>
  );
}