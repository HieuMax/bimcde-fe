// components/features/view2DManagement/ViewerShell.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DetailToolbar from "./toolbar2D";
import DetailView2D from "./viewHome";
import ShareFileDialog from "@/components/features/explorer/dialogs/ShareFileDialog";
import { IFile } from "@/types/explorer";

export default function ViewerShell({
  fileId,
  projectId,
  shareToken,
}: {
  fileId?: string;
  projectId?: string;
  shareToken?: string;
}) {
  const router = useRouter();

  const [fileName, setFileName] = useState("Đang tải...");
  const [fileData, setFileData] = useState<{ _id: string; name: string } | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

    const handleBack = () => {
        if (shareToken) {
        // Nếu đang xem dạng Share mà bấm Back -> Về trang chủ hoặc trang Login
        router.push("/login"); 
        } else {
        // Nếu là User nội bộ -> Về danh sách file
        router.push(`/projects/${projectId}/data`);
        }
    };

  return (
    <div
      className={`
        flex flex-col bg-white transition-all duration-300
        ${isFullscreen
          ? "fixed inset-0 z-100 h-screen w-screen"
          : "flex-1 h-[calc(100vh-60px)] min-h-0 relative"}
      `}
    >
      {/* TOOLBAR */}
      <DetailToolbar
        name={fileName}
        onBack={handleBack}
        onShare={() => {
          if (!fileData || shareToken) return;
          setIsShareOpen(true);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        canShare={!shareToken}
      />

      {/* VIEWER CORE */}
      <div className="flex-1 overflow-hidden relative">
        <DetailView2D
          mode={shareToken ? "file" : "view"}
          fileId={fileId}
          shareToken={shareToken}
          onLoaded={(file: IFile) => {
            setFileName(file.name);
            setFileData({ _id: file._id, name: file.name });
          }}
        />
      </div>

      {/* SHARE DIALOG */}
      {!shareToken && (
        <ShareFileDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          file={fileData}
        />
      )}
    </div>
  );
}
