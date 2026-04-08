"use client";

import React, { useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// Đảm bảo đường dẫn import đúng file bạn lưu component DetailView2D
import DetailView2D from "@/components/features/view2DManagement/viewHome";
import DetailToolbar from "@/components/features/view2DManagement/toolbar2D";
import DrawingToolBar from "@/components/features/view2DManagement/drawingToolBar";
import { ToolType } from "@/types/view2d";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
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

  const [fileName, setFileName] = useState("Đang tải...");
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
  }, []);
  //permission
  const canDownload = !isShareMode || fileData?.permission === "DOWNLOAD";

  // const handleToggleFullscreen = useCallback(() => {
  //   if (!document.fullscreenElement) {
  //     document.documentElement.requestFullscreen().catch((err) => {
  //       console.error("Lỗi khi bật toàn màn hình:", err);
  //     });
  //   } else if (document.exitFullscreen) {
  //     document.exitFullscreen();
  //   }
  // }, []);

  const handleDownloadRaw = useCallback(async () => {
    // Kiểm tra trực tiếp giá trị hiện tại
    if (!currentFileUrl) {
      toast.error("Đang tải dữ liệu file, vui lòng đợi...");
      return;
    }

    const loadingToast = toast.loading("Đang chuẩn bị bản PDF sạch...");

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
        toast.success("Tải về hoàn tất!", { id: loadingToast });
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
          toast.success("Tải về hoàn tất!", { id: loadingToast });
        };

        img.onerror = () => {
          toast.error("Không thể tải ảnh gốc. Lỗi CORS hoặc URL hết hạn.", {
            id: loadingToast,
          });
        };
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi hệ thống khi tải file.", { id: loadingToast });
    }
  }, [currentFileUrl, fileName]);

  return (
    <div className="flex flex-col w-screen h-screen">
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
      <DrawingToolBar
        onDownload={handleDownloadRaw}
        // onToggleFullscreen={handleToggleFullscreen}
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
          fileId={params.viewId}
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
