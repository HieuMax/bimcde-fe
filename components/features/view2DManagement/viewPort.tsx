"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect, useState } from "react";
import ImageViewer from "./imageViewer";
import { IFile } from "@/types/explorer";

import { ToolType, IAnnotation } from "@/types/view2d";

const PdfViewerClient = dynamic(() => import("./PdfViewer"), { ssr: false });
const WordViewerClient = dynamic(() => import("./WordViewer"), { ssr: false });

export default function FileViewport({
  file,
  currentSrc,
  pageIndex,
  zoom,
  pageRotation,
  onZoom,
  onRotatePage,
  onPrev,
  onNext,
  onPageChange,
  onRendered,
  onWordLoadSuccess,
  onWordThumbnailGenerated,
  // BỔ SUNG PROPS ANNOTATION TỪ VIEWHOME TRUYỀN XUỐNG
  activeTool = "cursor",
  activeColor = "#000000",
  annotations = [],
  onAnnotationsChange,
  showAnnotation = true,
}: {
  file: IFile | null;
  currentSrc: string | null;
  pageIndex: number;
  zoom: number;
  pageRotation: number;
  onZoom: (d: number) => void;
  onRotatePage: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  onRendered?: () => void;
  onWordLoadSuccess?: (total: number) => void;
  onWordThumbnailGenerated?: (index: number, src: string) => void;
  // BỔ SUNG TYPE CHO ANNOTATION
  activeTool?: ToolType;
  activeColor?: string;
  annotations?: IAnnotation[];
  onAnnotationsChange?: (anns: IAnnotation[]) => void;
  showAnnotation?: boolean;
}) {
  const [isViewLoading, setIsViewLoading] = useState(false);

  const { type, url } = useMemo(() => {
    if (!file) return { type: null, url: null };
    if (file.fileType === "PDF") {
      return { type: "PDF", url: file.fileUrl };
    }

    if (file.fileType === "WORD") {
      return { type: "WORD", url: file.fileUrl };
    }
    return { type: "IMAGE", url: currentSrc || file.fileUrl };
  }, [file, currentSrc]);

  useEffect(() => {
    if (!isViewLoading) return;

    const t = setTimeout(() => {
      console.warn("Force stop view loading");
      setIsViewLoading(false);
    }, 8000);

    return () => clearTimeout(t);
  }, [isViewLoading]);

  if (!file || !url) return null;

  return (
    <div className="absolute inset-0 bg-neutral-800">
      {/* ===== VIEWER ===== */}
      {type === "PDF" && (
        <PdfViewerClient
          src={url}
          currentPageIndex={pageIndex}
          zoom={zoom}
          pageRotation={pageRotation}
          onZoom={onZoom}
          onRotatePage={onRotatePage}
          onPrev={onPrev}
          onNext={onNext}
          onPageChange={onPageChange}
          onPageRendered={onRendered}
          // Truyền Props Vẽ xuống PDF
          // activeTool={activeTool}
          // activeColor={activeColor}
          // annotations={annotations}
          // onAnnotationsChange={onAnnotationsChange}
          // showAnnotation={showAnnotation}
        />
      )}

      {type === "WORD" && (
        <WordViewerClient
          src={url}
          zoom={zoom}
          onZoom={onZoom}
          pageIndex={pageIndex}
          onLoadSuccess={onWordLoadSuccess}
          onPageThumbnailGenerated={onWordThumbnailGenerated}
          onPrev={onPrev}
          onNext={onNext}
          onPageChange={onPageChange}
          // Truyền Props Vẽ xuống Word (nếu WordViewer hỗ trợ)
          // activeTool={activeTool}
          // activeColor={activeColor}
          // annotations={annotations}
          // onAnnotationsChange={onAnnotationsChange}
          // showAnnotation={showAnnotation}
        />
      )}

      {type === "IMAGE" && (
        <ImageViewer
          src={url}
          zoom={zoom}
          rotate={pageRotation}
          pageIndex={pageIndex}
          totalPages={1}
          onZoom={onZoom}
          onRotate={onRotatePage}
          onPrev={onPrev}
          onNext={onNext}
          // onPageChange={onPageChange}
          // Truyền Props Vẽ xuống Image
          activeTool={activeTool}
          activeColor={activeColor}
          annotations={annotations}
          onAnnotationsChange={onAnnotationsChange}
          showAnnotation={showAnnotation}
        />
      )}
    </div>
  );
}
