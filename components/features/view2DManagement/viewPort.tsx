"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import ImageViewer from "./imageViewer";
import { FileItem } from "@/types/api";
import { ToolType, IAnnotation } from "@/types/explorer";

const PdfViewerClient = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <div className="text-white">Loading PDF...</div>,
});

interface FileViewportProps {
  file: FileItem | null;
  currentSrc: string | null;
  pageIndex: number;
  zoom: number;
  rotate: number;
  onZoom: (d: number) => void;
  onRotate: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;

  // New Props
  activeTool: ToolType;
  annotations: IAnnotation[];
  onAnnotationsChange: (anns: IAnnotation[]) => void;
}

export default function FileViewport(props: FileViewportProps) {
  const { viewType, finalUrl, uniqueKey } = useMemo(() => {
    const isImageMode =
      props.currentSrc && !props.currentSrc.toLowerCase().endsWith(".pdf");
    const rawUrl = isImageMode
      ? props.currentSrc
      : props.file?.fileUrl ?? props.currentSrc ?? "";
    return {
      viewType: isImageMode ? "IMAGE" : "PDF",
      finalUrl: rawUrl,
      uniqueKey: `${rawUrl}-${props.pageIndex}`,
    };
  }, [props.file, props.currentSrc, props.pageIndex]);

  // IMAGE MODE: Nhúng Annotation
  if (viewType === "IMAGE") {
    return (
      <ImageViewer key={uniqueKey} src={finalUrl} {...props} totalPages={1} />
    );
  }

  // PDF MODE:
  // Lưu ý: Nếu muốn vẽ lên PDF, bạn cần bọc PdfViewer trong 1 div relative
  // và đặt AnnotationLayer (Canvas) đè lên trên.
  // Tuy nhiên PDF rất khó scale canvas khớp với PDF renderer (canvas vs svg/canvas của pdfjs).
  // Tạm thời chỉ hỗ trợ xem PDF hoặc logic vẽ lên PDF cần PdfViewer render ra ảnh từng trang.
  if (finalUrl && finalUrl.length > 10) {
    return (
      <div className="flex-1 relative w-full h-full bg-gray-700">
        <PdfViewerClient
          key={uniqueKey}
          src={finalUrl}
          currentPageIndex={props.pageIndex}
        />
        {/* NẾU MUỐN VẼ LÊN PDF: Uncomment và chỉnh CSS absolute overlay */}
        {/* <div className="absolute inset-0 z-50 pointer-events-none">
             AnnotationLayer here but needs sync zoom/scroll with PDF Viewer 
            </div> */}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-400">
      Select a document
    </div>
  );
}
