"use client";
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnnotationLayer, { AnnotationLayerHandle } from "./annotationLayer";
import { ToolType, IAnnotation } from "@/types/view";
import { viewService } from "@/services/view.service";

/* ================= TYPES ================= */

interface ImageViewerProps {
  src?: string;
  zoom: number;
  rotate: number;
  showAnnotation: boolean;
  onZoom: (delta: number) => void;
  onRotate: (deg: number) => void;
  pageIndex?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;

  activeTool: ToolType;
  activeColor: string;
  annotations: IAnnotation[];
  onAnnotationsChange: (anns: IAnnotation[]) => void;
}

export interface ImageViewerHandle {
  exportSnapshot: () => Promise<Blob | null>;
}

/* ================= COMPONENT ================= */

const ImageViewer = forwardRef<ImageViewerHandle, ImageViewerProps>(
  (
    {
      src,
      zoom,
      rotate,
      showAnnotation,
      onZoom,
      onRotate,
      pageIndex = 1,
      totalPages = 1,
      onPrev,
      onNext,
      activeTool,
      activeColor,
      annotations,
      onAnnotationsChange,
    },
    ref,
  ) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const annotationRef = useRef<AnnotationLayerHandle>(null);

    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

    // State để lưu URL nội bộ (blob:...)
    const [localUrl, setLocalUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setImgSize({ w: naturalWidth, h: naturalHeight });
    };

    useEffect(() => {
      if (!src) {
        setLocalUrl(null);
        return;
      }

      let objectUrl: string | null = null;
      setIsLoading(true);

      const loadImage = async () => {
        try {
          const blob = await viewService.downloadProxiedImage(src);

          objectUrl = URL.createObjectURL(blob);
          setLocalUrl(objectUrl);
        } catch (err) {
          console.error(
            "Proxy load failed, falling back to original src:",
            err,
          );
          // Fallback: Nếu Proxy lỗi (ví dụ Backend chưa deploy), dùng link gốc
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
      <div className="flex-1 relative bg-[#6b6a73] overflow-hidden">
        {/* Viewport */}
        <div className="absolute inset-0 flex items-center justify-center overflow-auto">
          {localUrl ? (
            <div
              className="relative shadow-lg"
              style={{
                transform: `scale(${zoom}) rotate(${rotate}deg)`,
                transformOrigin: "center center",
                transition: "transform 100ms ease-out",
              }}
            >
              {/* ===== IMAGE LAYER ===== */}
              <img
                ref={imgRef}
                src={localUrl} // Dùng URL Blob ở đây
                // crossOrigin="anonymous"
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
                  <div className="text-white bg-black/50 px-3 py-1 rounded">
                    Loading Image...
                  </div>
                </div>
              )}

              {/* ===== ANNOTATION LAYER ===== */}
              {!isLoading && imgSize.w > 0 && showAnnotation && (
                <AnnotationLayer
                  ref={annotationRef}
                  width={imgSize.w}
                  height={imgSize.h}
                  zoom={zoom}
                  rotate={rotate}
                  activeTool={activeTool}
                  activeColor={activeColor}
                  annotations={annotations}
                  onChangeAnnotations={onAnnotationsChange}
                />
              )}
            </div>
          ) : (
            <div className="text-white/80">
              {src ? "Loading preview..." : "No preview available"}
            </div>
          )}
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg z-[60]">
          <button
            onClick={onPrev}
            className="p-2 hover:bg-white/10"
            disabled={!onPrev}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm px-2 bg-white text-black rounded select-none">
            {pageIndex} / {totalPages}
          </span>
          <button
            onClick={onNext}
            className="p-2 hover:bg-white/10"
            disabled={!onNext}
          >
            <ChevronRight size={18} />
          </button>
          <div className="border-l h-6 mx-1 opacity-50" />
          <button onClick={() => onZoom(-0.1)}>
            <ZoomOut size={16} />
          </button>
          <button onClick={() => onZoom(+0.1)}>
            <ZoomIn size={16} />
          </button>
          <button onClick={() => onRotate(90)}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    );
  },
);

ImageViewer.displayName = "ImageViewer";

export default ImageViewer;
