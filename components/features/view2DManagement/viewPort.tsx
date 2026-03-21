// src/components/features/view2DManagement/viewPort.tsx
"use client";

import React, { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import dynamic from "next/dynamic";
import ImageViewer, { ImageViewerHandle } from "./imageViewer"; // Import thêm Type ImageViewerHandle
import { FileItem } from "@/types/view"; // Đã sửa đường dẫn import cho đúng context
import { ToolType, IAnnotation } from "@/types/view";

const PdfViewerClient = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <div className="text-white">Loading PDF...</div>,
});

/* ===== TYPES ===== */

export interface FileViewportHandle {
  exportSnapshot: () => Promise<Blob | null>;
}

interface FileViewportProps {
  file: FileItem | null;
  currentSrc: string | null;
  pageIndex: number;
  zoom: number;
  rotate: number;
  showAnnotation: boolean;
  onZoom: (d: number) => void;
  onRotate: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;

  // Drawing
  activeTool: ToolType;
  activeColor: string;
  annotations: IAnnotation[];
  onAnnotationsChange: (anns: IAnnotation[]) => void;
  onSelectAnnotation?: (id: string | null) => void;
}

/* ===== COMPONENT ===== */

const FileViewport = forwardRef<FileViewportHandle, FileViewportProps>(
  (props, ref) => {
    const imageViewerRef = useRef<ImageViewerHandle>(null);

    const { viewType, finalUrl, uniqueKey } = useMemo(() => {
      const isImageMode =
        props.currentSrc && !props.currentSrc.toLowerCase().endsWith(".pdf");

      const rawUrl = isImageMode
        ? props.currentSrc
        : (props.file?.fileUrl ?? props.currentSrc ?? "");

      return {
        viewType: isImageMode ? "IMAGE" : "PDF",
        finalUrl: rawUrl,
        uniqueKey: `${rawUrl}-${props.pageIndex}`,
      };
    }, [props.file, props.currentSrc, props.pageIndex]);

    /* ===== EXPOSE HANDLE ===== */
    useImperativeHandle(ref, () => ({
      exportSnapshot: async () => {
        // SỬA LẠI LOGIC: Chỉ export được khi đang ở chế độ xem ảnh (hoặc PDF page được convert sang ảnh)
        if (viewType === "IMAGE") {
          return (await imageViewerRef.current?.exportSnapshot()) ?? null;
        }
        // Nếu cần hỗ trợ PDF, bạn cần implement exportSnapshot trong PdfViewerClient tương tự
        return null;
      },
    }));

    /* ===== RENDER ===== */

    if (viewType === "IMAGE") {
      return (
        <ImageViewer
          ref={imageViewerRef}
          key={uniqueKey}
          src={finalUrl || ""}
          totalPages={1}
          {...props}
        />
      );
    }

    if (finalUrl && finalUrl.length > 10) {
      return (
        <div className="flex-1 relative w-full h-full bg-gray-700">
          <PdfViewerClient
            key={uniqueKey}
            src={finalUrl}
            currentPageIndex={props.pageIndex}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-400">
        Select a document
      </div>
    );
  },
);

FileViewport.displayName = "FileViewport";

export default FileViewport;
