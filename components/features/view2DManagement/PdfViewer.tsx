'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
}) {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const isScrollDriven = useRef(false);
  const currentPageIndexRef = useRef(currentPageIndex);

  useEffect(() => {
    if (!containerRef.current || pageRefs.current.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            // Nếu phát hiện trang mới nằm giữa màn hình
            if (pageNum && pageNum !== currentPageIndexRef.current) {
              isScrollDriven.current = true; // Đánh dấu là do user cuộn chuột
              onPageChange?.(pageNum); // Báo về Control Bar nhảy số
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '-40% 0px -40% 0px', // Bắt giao điểm ở khoảng giữa màn hình
      }
    );

    const timeoutId = setTimeout(() => {
      pageRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [numPages, zoom, onPageChange]);
  
  /* ===== OBSERVE WIDTH ===== */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ===== SCROLL TO ACTIVE PAGE ===== */
  useEffect(() => {
    if (isScrollDriven.current) {
      isScrollDriven.current = false;
      return;
    }
    
    if (pageRefs.current.has(currentPageIndex) && containerRef.current) {
      const el = pageRefs.current.get(currentPageIndex);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPageIndex]);

  return (
    <div className="w-full h-full relative bg-[#6b6a73]">
      <div ref={containerRef} className="absolute inset-0 overflow-y-auto p-2">
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
                ref={(el) => el && pageRefs.current.set(pageNumber, el)}
                data-page-number={pageNumber}
                className="mb-4 flex justify-center"
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
        <button onClick={onPrev}><ChevronLeft size={18} /></button>
        <div className="bg-white text-black px-3 rounded text-sm">
          {currentPageIndex} / {numPages}
        </div>
        <button onClick={onNext}><ChevronRight size={18} /></button>
        <button onClick={() => onZoom(-0.1)}><ZoomOut size={16} /></button>
        <button onClick={() => onZoom(0.1)}><ZoomIn size={16} /></button>
        <button onClick={() => onRotatePage(90)}><RotateCcw size={16} /></button>
      </div>
    </div>
  );
}