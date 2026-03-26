'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ImageViewer({
  src,
  alt,
  zoom,
  rotate,
  onZoom,
  onRotate,
  pageIndex = 1,
  totalPages = 1,
  onPrev,
  onNext,
}: {
  src?: string;
  alt?: string;
  zoom: number;
  rotate: number;
  onZoom: (delta: number) => void;
  onRotate: (deg: number) => void;
  pageIndex?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  /* ===== OBSERVE CONTAINER SIZE (KEY FIX) ===== */
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!src) {
    return (
      <div className="flex items-center justify-center h-full text-white/80">
        No preview
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#6b6a73] overflow-hidden">

      {/* ===== VIEWPORT ===== */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="select-none"
          style={{
            width: containerSize.width * zoom,
            height: 'auto',
            maxHeight: containerSize.height * zoom,
            transform: `rotate(${rotate}deg)`,
            transformOrigin: 'center center',
            transition: 'width 140ms ease-out, transform 140ms ease-out',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* ===== CONTROL BAR ===== */}
      <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg z-50">
        <button onClick={onPrev} className="p-1 hover:bg-white/10 rounded disabled:opacity-50" disabled={pageIndex <= 1}>
          <ChevronLeft size={18} />
        </button>
        <div className="bg-white text-black px-3 py-0.5 rounded text-sm font-medium">
          {pageIndex} / {totalPages}
        </div>
        <button onClick={onNext} className="p-1 hover:bg-white/10 rounded disabled:opacity-50" disabled={pageIndex >= totalPages}>
          <ChevronRight size={18} />
        </button>
        <div className="bg-white text-black px-2 py-0.5 rounded text-sm font-medium ml-2 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button onClick={() => onZoom(-0.1)} className="p-1 hover:bg-white/10 rounded ml-2">
          <ZoomOut size={18} />
        </button>
        <button onClick={() => onZoom(0.1)} className="p-1 hover:bg-white/10 rounded">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => onRotate(90)} className="p-1 hover:bg-white/10 rounded">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}