"use client";

import React, { useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import DetailView2D from "@/components/features/view2DManagement/viewHome";
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";
import { ToolType } from "@/types/view2d";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import ShareFileDialog from "@/components/features/explorer/dialogs/ShareFileDialog";

import { IFile } from "@/types/explorer";

export default function Page() {
  const params = useParams() as { projectId: string; viewId: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  const fileIdFromQuery = searchParams?.get("fileId") ?? undefined;

  // Lấy token từ URL (do file redirect phía trên bắn sang)
  const shareToken = searchParams?.get("shareToken") ?? undefined;

  // const viewId = searchParams?.get("viewId") || "";
  // Xác định chế độ Share
  const isShareMode = !!shareToken;

  const [fileName, setFileName] = useState("Loading...");
  const [fileData, setFileData] = useState<IFile | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ===== REFS ===== */
  const openViewPanelRef = useRef<(() => void) | null>(null);
  const openTodoPanelRef = useRef<(() => void) | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("cursor");
  const [activeColor, setActiveColor] = useState("#000000");
  const [showAnnotation, setShowAnnotation] = useState(true);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);

  // TODO: Get real user ID from context
  const currentUserId = "REPLACE_WITH_REAL_USER_ID";

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
    setCurrentFileUrl(file.fileUrl || null); // Cập nhật file URL để download ảnh/pdf
  }, []);

  //permission
  const canDownload = !isShareMode || fileData?.permission === "DOWNLOAD";

  const handleDownloadRaw = useCallback(async () => {
    // Kiểm tra trực tiếp giá trị hiện tại
    if (!currentFileUrl) {
      toast.error("File data is still loading. Please wait...");
      return;
    }

    const loadingToast = toast.loading("Preparing clean PDF...");

    try {
      const isPDF = currentFileUrl.toLowerCase().split("?")[0].endsWith(".pdf");

      if (isPDF) {
        // Tải PDF gốc (giữ nguyên logic fetch của bạn)
        const response = await fetch(currentFileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Download complete!", { id: loadingToast });
      } else {
        // LOGIC CHO ẢNH -> PDF
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `${currentFileUrl}${currentFileUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? "l" : "p",
            unit: "px",
            format: [img.width, img.height],
          });

          pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
          pdf.save(`${fileName}_original.pdf`);
          toast.success("Download complete!", { id: loadingToast });
        };

        img.onerror = () => {
          toast.error("Could not load source image. CORS issue or expired URL.", {
            id: loadingToast,
          });
        };
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to download file.", { id: loadingToast });
    }
  }, [currentFileUrl, fileName]);

  return (
    <div className="flex flex-col w-screen h-screen">
      {/* GỘP CHUNG VÀO 1 COMPONENT DETAIL TOOLBAR */}
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
        // --- Props Drawing Tool ---
        onDownload={handleDownloadRaw}
        onToggleAnnotation={() => setShowAnnotation((prev) => !prev)}
        showAnnotation={showAnnotation}
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        activeColor={activeColor}
        onChangeColor={setActiveColor}
      />

      <div className="flex-1 relative overflow-hidden">
        <DetailView2D
          mode="view"
          fileId={fileIdFromQuery}
          activeTool={activeTool}
          activeColor={activeColor}
          showAnnotation={showAnnotation}
          shareToken={shareToken}
          onLoaded={handleLoaded}
          onRegisterOpenViewPanel={(fn) => {
            openViewPanelRef.current = fn;
          }}
          onRegisterOpenTodoPanel={(fn) => {
            openTodoPanelRef.current = fn;
          }}
          currentUser={currentUserId}
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
