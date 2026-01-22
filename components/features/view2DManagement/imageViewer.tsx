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
        <button onClick={onPrev} className="p-2 rounded hover:bg-white/10">
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 bg-white text-black rounded px-2">
          <span className="text-sm">{pageIndex}</span>
          <span className="text-xs">/ {totalPages}</span>
        </div>

        <button onClick={onNext} className="p-2 rounded hover:bg-white/10">
          <ChevronRight size={18} />
        </button>

        <div className="border-l h-6 opacity-40 mx-2" />

        <button onClick={() => onZoom(-0.1)} className="p-2 rounded hover:bg-white/10">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => onZoom(0.1)} className="p-2 rounded hover:bg-white/10">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => onRotate(90)} className="p-2 rounded hover:bg-white/10">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

// 'use client';
// import React, { useRef } from 'react';
// import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

// export default function ImageViewer({
//   src,
//   alt,
//   zoom,
//   rotate,
//   onZoom,
//   onRotate,
//   pageIndex = 1,
//   totalPages = 1,
//   onPrev,
//   onNext,
// }: {
//   src?: string;
//   alt?: string;
//   zoom: number;
//   rotate: number;
//   onZoom: (delta: number) => void;
//   onRotate: (deg: number) => void;
//   pageIndex?: number;
//   totalPages?: number;
//   onPrev?: () => void;
//   onNext?: () => void;
//   containerMinHeight?: number;
// }) {
//   const imgRef = useRef<HTMLImageElement | null>(null);
//     return (
//       <div className="flex-1 relative bg-[#6b6a73] overflow-hidden">
//         {/* Viewport */}
//         <div className="absolute inset-0 flex items-center justify-center overflow-auto">
//           {src ? (
//             <img
//               ref={imgRef}
//               src={src}
//               alt={alt}
//               draggable={false}
//               className="select-none"
//               style={{
//                 transform: `scale(${zoom}) rotate(${rotate}deg)`,
//                 transformOrigin: 'center center',
//                 transition: 'transform 140ms ease-out',
//                 maxWidth: '100%',
//                 maxHeight: '100%',
//                 objectFit: 'contain',
//               }}
//             />
//           ) : (
//             <div className="text-white/80">No preview</div>
//           )}
//         </div>

//         {/* Controls */}
//         <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg">
//           <button onClick={onPrev} className="p-2 rounded hover:bg-white/10">
//             <ChevronLeft size={18} />
//           </button>

//           <div className="flex items-center gap-2 bg-white text-black rounded px-2">
//             <span className="text-sm">{pageIndex}</span>
//             <span className="text-xs">/ {totalPages}</span>
//           </div>

//           <button onClick={onNext} className="p-2 rounded hover:bg-white/10">
//             <ChevronRight size={18} />
//           </button>

//           <div className="border-l h-6" />

//           <button onClick={() => onZoom(-0.1)} className="p-2 rounded hover:bg-white/10">
//             <ZoomOut size={16} />
//           </button>
//           <button onClick={() => onZoom(+0.1)} className="p-2 rounded hover:bg-white/10">
//             <ZoomIn size={16} />
//           </button>
//           <button onClick={() => onRotate(90)} className="p-2 rounded hover:bg-white/10">
//             <RotateCcw size={16} />
//           </button>
//         </div>
//       </div>
//     );

// }
