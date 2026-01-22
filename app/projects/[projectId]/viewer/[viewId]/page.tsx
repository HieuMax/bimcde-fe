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

  const shareToken = searchParams?.get("shareToken") ?? undefined;

  /* ===== FILE STATE ===== */
  const [fileName, setFileName] = useState("Đang tải...");
  const [fileData, setFileData] = useState<IFile | null>(null);

  /* ===== UI STATE ===== */
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ===== IMPERATIVE HANDLES (QUAN TRỌNG) ===== */
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

  return (
    <div
      className={`
        flex flex-col bg-white transition-all duration-300
        ${
          isFullscreen
            ? "fixed inset-0 z-50 h-screen w-screen"
            : "flex-1 h-[calc(100vh-60px)] min-h-0 relative"
        }
      `}
    >
      {/* ================= TOP TOOLBAR ================= */}
      <DetailToolbar
        name={fileName}
        onBack={handleBack}
        canShare={!shareToken}
        onShare={() => {
          if (!fileData) return;
          setIsShareOpen(true);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onOpenViewPanel={() => openViewPanelRef.current?.()}
        onOpenTodoPanel={() => openTodoPanelRef.current?.()}
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 overflow-hidden relative">
        <DetailView2D
          mode={shareToken ? "share" : "view"}
          fileId={params.viewId}
          shareToken={shareToken}
          onLoaded={(file) => {
            setFileName(file.name);
            setFileData(file);
          }}
          /* ===== KẾT NỐI NGƯỢC LẠI TOOLBAR ===== */
          onRegisterOpenViewPanel={(fn) => {
            openViewPanelRef.current = fn;
          }}
          onRegisterOpenTodoPanel={(fn) => {
            openTodoPanelRef.current = fn;
          }}
        />
      </div>

      {/* ================= SHARE DIALOG ================= */}
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
// // bimcde-fe\app\projects\[projectId]\viewer\[viewId]\page.tsx