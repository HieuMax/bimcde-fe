"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import DetailView2D from "@/components/features/view2DManagement/viewHome";
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";
import ShareFileDialog from "@/components/features/explorer/dialogs/ShareFileDialog";

import { IFile } from "@/types/explorer";

export default function Page() {
  const params = useParams() as { projectId: string; viewId: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy token từ URL (do file redirect phía trên bắn sang)
  const shareToken = searchParams?.get("shareToken") ?? undefined;
  
  // Xác định chế độ Share
  const isShareMode = !!shareToken;

  /* ===== STATE ===== */
  const [fileName, setFileName] = useState("Đang tải...");
  const [fileData, setFileData] = useState<IFile | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ===== REFS ===== */
  const openViewPanelRef = useRef<(() => void) | null>(null);
  const openTodoPanelRef = useRef<(() => void) | null>(null);

  /* ===== HANDLERS ===== */
  const handleBack = () => {
    if (shareToken) {
      router.push("/login"); 
    } else {
      router.push(`/projects/${params.projectId}/data`);
    }
  };

  const handleLoaded = React.useCallback((file: IFile) => {
    setFileName(file.name);
    setFileData(file);
  }, []);
  //permission
  const canDownload = !isShareMode || (fileData?.permission === "DOWNLOAD");
  return (
    <div
      className={`
        flex flex-col bg-white transition-all duration-300
        ${
          isFullscreen || isShareMode
            ? "fixed inset-0 z-[999] h-screen w-screen"
            : "flex-1 h-[calc(100vh-60px)] min-h-0 relative"
        }
      `}
    >
      {/* ================= TOOLBAR ================= */}
      <DetailToolbar
        name={fileName}
        onBack={handleBack}
        canShare={!isShareMode} 
        canDownload={canDownload}
        onShare={() => {
          if (!fileData) return;
          setIsShareOpen(true);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onOpenViewPanel={() => openViewPanelRef.current?.()}
        onOpenTodoPanel={() => openTodoPanelRef.current?.()}
      />

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-hidden relative">
        <DetailView2D
          mode={isShareMode ? "share" : "view"} 
          fileId={params.viewId}
          shareToken={shareToken}
          onLoaded={handleLoaded}

          onRegisterOpenViewPanel={(fn) => { openViewPanelRef.current = fn; }}
          onRegisterOpenTodoPanel={(fn) => { openTodoPanelRef.current = fn; }}
        />
      </div>

      {/* ================= DIALOGS ================= */}
      {!isShareMode && (
        <ShareFileDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          file={fileData}
        />
      )}
    </div>
  );
}

// bimcde-fe\app\projects\[projectId]\viewer\[viewId]\page.tsx