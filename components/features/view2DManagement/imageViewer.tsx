"use client";

import React, { useRef, useState, forwardRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnnotationLayer, { AnnotationLayerHandle } from "./annotationLayer";
import { ToolType, IAnnotation } from "@/types/view2d";
import { view2DService } from "@/services/view2d.service"; // Đã điều chỉnh cho khớp service hiện tại

/* ================= TYPES ================= */

interface ImageViewerProps {
  src?: string;
  alt?: string;
  zoom: number;
  rotate: number;
  showAnnotation?: boolean;
  onZoom: (delta: number) => void;
  onRotate: (deg: number) => void;
  pageIndex?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;

  activeTool?: ToolType;
  activeColor?: string;
  annotations?: IAnnotation[];
  onAnnotationsChange?: (anns: IAnnotation[]) => void;
}

export interface ImageViewerHandle {
  exportSnapshot: () => Promise<Blob | null>;
}

/* ================= COMPONENT ================= */

const ImageViewer = forwardRef<ImageViewerHandle, ImageViewerProps>(
  (
    {
      src,
      alt,
      zoom,
      rotate,
      showAnnotation = true,
      onZoom,
      onRotate,
      pageIndex = 1,
      totalPages = 1,
      onPrev,
      onNext,
      activeTool = "cursor",
      activeColor = "#000000",
      annotations = [],
      onAnnotationsChange,
    },
    ref,
  ) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const annotationRef = useRef<AnnotationLayerHandle>(null);

    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [localUrl, setLocalUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Xử lý proxy tải ảnh (để tránh lỗi CORS khi vẽ Canvas)
    useEffect(() => {
      if (!src) {
        setLocalUrl(null);
        return;
      }

      let objectUrl: string | null = null;
      setIsLoading(true);

      const loadImage = async () => {
        try {
          // GỌI PROXY NẾU CÓ, NẾU CHƯA CÓ TRONG SERVICE THÌ DÙNG SRC GỐC
          if (
            typeof (view2DService as any).downloadProxiedImage === "function"
          ) {
            const blob = await (view2DService as any).downloadProxiedImage(src);
            objectUrl = URL.createObjectURL(blob);
            setLocalUrl(objectUrl);
          } else {
            // Fallback nếu hàm downloadProxiedImage chưa được định nghĩa
            setLocalUrl(src);
          }
        } catch (err) {
          console.error(
            "Proxy load failed, falling back to original src:",
            err,
          );
          setLocalUrl(src);
        } finally {
          setIsLoading(false);
        }
      };

      loadImage();

      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }, [src]);

    /* ================= RENDER ================= */

    return (
      <div className="absolute inset-0 bg-[#6b6a73] overflow-hidden custom-scrollbar">
        {/* Viewport chứa ảnh và nét vẽ */}
        <div
          className={`absolute inset-0 flex items-center justify-center overflow-auto ${
            activeTool !== "cursor" && activeTool !== "hand"
              ? "cursor-crosshair"
              : ""
          }`}
        >
          {localUrl ? (
            <div
              className="relative shadow-lg"
              style={{
                // 🌟 Logic cốt lõi: Zoom toàn bộ container thay vì gán width/height
                transform: `scale(${zoom}) rotate(${rotate}deg)`,
                transformOrigin: "center center",
                transition: "transform 140ms ease-out",
              }}
            >
              {/* ===== IMAGE LAYER ===== */}
              <img
                ref={imgRef}
                src={localUrl}
                alt={alt || "View Page"}
                draggable={false}
                className={`select-none block max-w-none ${isLoading ? "opacity-50" : "opacity-100"}`}
                onLoad={(e) =>
                  setImgSize({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                onError={(e) => {
                  console.error("Image load error on tag", e);
                  setIsLoading(false);
                }}
              />

              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white bg-black/50 px-3 py-1 text-sm rounded shadow-sm">
                    Loading Image...
                  </div>
                </div>
              )}

              {/* ===== ANNOTATION LAYER ===== */}
              {!isLoading &&
                imgSize.w > 0 &&
                showAnnotation &&
                onAnnotationsChange && (
                  <div className="absolute inset-0">
                    <AnnotationLayer
                      ref={annotationRef as any}
                      width={imgSize.w}
                      height={imgSize.h}
                      zoom={zoom} // Chỉ truyền xuống cho các logic tính toán text/stroke nếu cần
                      rotate={rotate}
                      activeTool={activeTool}
                      activeColor={activeColor}
                      annotations={annotations}
                      onChangeAnnotations={onAnnotationsChange}
                      showAnnotation={showAnnotation}
                    />
                  </div>
                )}
            </div>
          ) : (
            <div className="text-white/80">
              {src ? "Loading preview..." : "No preview available"}
            </div>
          )}
        </div>

        {/* ===== CONTROLS ===== */}
        {/* Nổi lên trên cùng (z-[100]) và cản sự kiện click (stopPropagation) */}
        <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg z-[100]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            disabled={!onPrev}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 bg-white text-black rounded px-2 py-0.5 select-none">
            <span className="text-sm font-bold">{pageIndex}</span>
            <span className="text-xs font-medium text-gray-500">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            disabled={!onNext}
          >
            <ChevronRight size={18} />
          </button>

          <div className="border-l h-6 mx-1 opacity-50" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoom(-0.1);
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <div className="text-xs font-medium w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoom(+0.1);
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate(90);
            }}
            className="p-2 hover:bg-white/10 rounded transition-colors ml-2"
            title="Rotate"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    );
  },
);

ImageViewer.displayName = "ImageViewer";

export default ImageViewer;
