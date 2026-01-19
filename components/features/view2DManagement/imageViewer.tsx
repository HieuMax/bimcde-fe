"use client";
import React, { useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnnotationLayer from "./annotationLayer";
import { ToolType, IAnnotation } from "@/types/explorer";

interface ImageViewerProps {
  src?: string;
  zoom: number;
  rotate: number;
  onZoom: (delta: number) => void;
  onRotate: (deg: number) => void;
  pageIndex?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;

  // Annotation Props
  activeTool: ToolType;
  annotations: IAnnotation[];
  onAnnotationsChange: (anns: IAnnotation[]) => void;
}

export default function ImageViewer({
  src,
  zoom,
  rotate,
  onZoom,
  onRotate,
  pageIndex = 1,
  totalPages = 1,
  onPrev,
  onNext,
  activeTool,
  annotations,
  onAnnotationsChange,
}: ImageViewerProps) {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  return (
    <div className="flex-1 relative bg-[#6b6a73] overflow-hidden">
      {/* Viewport Container */}
      <div className="absolute inset-0 flex items-center justify-center overflow-auto">
        {src ? (
          <div
            className="relative shadow-lg"
            style={{
              transform: `scale(${zoom}) rotate(${rotate}deg)`,
              transformOrigin: "center center",
              transition: "transform 100ms ease-out",
            }}
          >
            {/* 1. LAYER ẢNH */}
            <img
              src={src}
              draggable={false}
              className="select-none block max-w-none"
              onLoad={(e) => {
                setImgSize({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                });
              }}
            />

            {/* 2. LAYER VẼ (CANVAS) */}
            {/* Canvas nằm đè lên ảnh, có cùng kích thước thật của ảnh */}
            {imgSize.w > 0 && (
              <AnnotationLayer
                width={imgSize.w}
                height={imgSize.h}
                zoom={zoom}
                activeTool={activeTool}
                annotations={annotations}
                onChangeAnnotations={onAnnotationsChange}
              />
            )}
          </div>
        ) : (
          <div className="text-white/80">No preview</div>
        )}
      </div>

      {/* Controls (Giữ nguyên) */}
      <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg z-[60]">
        <button onClick={onPrev} className="p-2 hover:bg-white/10">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm px-2 bg-white text-black rounded">
          {pageIndex} / {totalPages}
        </span>
        <button onClick={onNext} className="p-2 hover:bg-white/10">
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
}
