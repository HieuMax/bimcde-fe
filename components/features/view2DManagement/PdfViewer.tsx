"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// BỔ SUNG IMPORT TYPE
import { ToolType, IAnnotation } from "@/types/view2d";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerClient({
  src,
  currentPageIndex,
  zoom,
  pageRotation,
  onRotatePage,
  onZoom,
  onPrev,
  onNext,
  onPageChange,
  onPageRendered,
  // BỔ SUNG CÁC BIẾN DRAWING TỪ VIEWPORT TRUYỀN XUỐNG
  activeTool = "cursor",
  activeColor = "#000000",
  annotations = [],
  onAnnotationsChange,
  showAnnotation = true,
}: {
  src: string;
  currentPageIndex: number;
  zoom: number;
  pageRotation: number;
  onRotatePage: (d: number) => void;
  onZoom: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  onPageRendered?: () => void;
  // BỔ SUNG KHAI BÁO TYPE
  activeTool?: ToolType;
  activeColor?: string;
  annotations?: IAnnotation[];
  onAnnotationsChange?: (anns: IAnnotation[]) => void;
  showAnnotation?: boolean;
}) {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });

  const currentPageIndexRef = useRef(currentPageIndex);
  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  const lastObserverPageRef = useRef<number | null>(null);
  const suppressObserverUntilRef = useRef(0);
  const visibilityMapRef = useRef(new Map<number, number>());
  const rafFlushIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || numPages === 0) return;

    const flushVisibility = () => {
      rafFlushIdRef.current = null;
      const map = visibilityMapRef.current;
      let bestPage = 0;
      let bestRatio = -1;
      map.forEach((ratio, page) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestPage = page;
        }
      });
      map.clear();

      const minRatio = 0.12;
      if (!bestPage || bestRatio < minRatio) return;
      if (Date.now() < suppressObserverUntilRef.current) return;
      if (bestPage === currentPageIndexRef.current) return;

      lastObserverPageRef.current = bestPage;
      currentPageIndexRef.current = bestPage;
      onPageChangeRef.current?.(bestPage);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = Number(
            entry.target.getAttribute("data-page-number"),
          );
          if (!pageNum) continue;
          visibilityMapRef.current.set(pageNum, entry.intersectionRatio);
        }
        if (rafFlushIdRef.current == null) {
          rafFlushIdRef.current = requestAnimationFrame(flushVisibility);
        }
      },
      {
        root: containerRef.current,
        rootMargin: "0px",
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
      },
    );

    const timeoutId = setTimeout(() => {
      pageRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (rafFlushIdRef.current != null) {
        cancelAnimationFrame(rafFlushIdRef.current);
        rafFlushIdRef.current = null;
      }
      visibilityMapRef.current.clear();
      observer.disconnect();
    };
  }, [numPages, zoom]);

  /* ===== OBSERVE WIDTH ===== */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (lastObserverPageRef.current === currentPageIndex) {
      lastObserverPageRef.current = null;
      return;
    }

    if (pageRefs.current.has(currentPageIndex) && containerRef.current) {
      const el = pageRefs.current.get(currentPageIndex);
      suppressObserverUntilRef.current = Date.now() + 500;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentPageIndex, numPages]);

  return (
    <div className="w-full h-full relative bg-[#6b6a73]">
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-y-auto p-2 ${activeTool !== "cursor" && activeTool !== "hand" ? "cursor-crosshair" : ""}`}
      >
        <Document
          file={src}
          loading={null}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from({ length: numPages }).map((_, i) => {
            const pageNumber = i + 1;
            return (
              <div
                key={pageNumber}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNumber, el);
                }}
                data-page-number={pageNumber}
                className="mb-4 flex justify-center relative"
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(containerWidth * 0.9, 850)}
                  scale={zoom}
                  rotate={pageNumber === currentPageIndex ? pageRotation : 0}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onRenderSuccess={() => {
                    if (pageNumber === currentPageIndex) {
                      onPageRendered?.();
                    }
                  }}
                />

              </div>
            );
          })}
        </Document>
      </div>

      {/* ===== CONTROL BAR ===== */}
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 bg-[#2f2b36] text-white rounded-md px-2 py-2 flex items-center gap-3 shadow-lg z-50">
        <button onClick={onPrev}>
          <ChevronLeft size={18} />
        </button>
        <div className="bg-white text-black px-3 rounded text-sm">
          {currentPageIndex} / {numPages}
        </div>
        <button onClick={onNext}>
          <ChevronRight size={18} />
        </button>
        <button onClick={() => onZoom(-0.1)}>
          <ZoomOut size={16} />
        </button>
        <button onClick={() => onZoom(0.1)}>
          <ZoomIn size={16} />
        </button>
        <button onClick={() => onRotatePage(90)}>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
