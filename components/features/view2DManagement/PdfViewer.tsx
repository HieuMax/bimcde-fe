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
  onPageRendered,
  onPageThumbnailGenerated
}: {
  src: string;
  currentPageIndex: number;
  zoom: number;
  pageRotation: number;
  onRotatePage: (d: number) => void;
  onZoom: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPageRendered?: () => void;
  onPageThumbnailGenerated?: (index: number, src: string) => void; 
}) {
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
    const el = pageRefs.current.get(currentPageIndex);
    if (el && containerRef.current) {
      containerRef.current.scrollTo({
        top: el.offsetTop - 32,
        behavior: 'smooth',
      });
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
                // ref={(el) => el && pageRefs.current.set(pageNumber, el)}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNumber, el);
                }}
                className="mb-4 flex justify-center"
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(containerWidth * 0.9, 850)}
                  scale={zoom}
                  rotate={pageNumber === currentPageIndex ? pageRotation : 0}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  // onRenderSuccess={() => {
                  //   if (pageNumber === currentPageIndex) {
                  //     onPageRendered?.(); 
                  //   }
                  // }}
                  onRenderSuccess={() => {
                    if (pageNumber === currentPageIndex) onPageRendered?.(); 
                    
                    if (onPageThumbnailGenerated) {
                      setTimeout(() => {
                        const el = pageRefs.current.get(pageNumber);
                        const canvas = el?.querySelector('canvas');
                        if (canvas) {
                          try {
                            const thumbSrc = canvas.toDataURL("image/jpeg", 0.5);
                            onPageThumbnailGenerated(pageNumber, thumbSrc);
                          } catch (e) {
                            console.warn("Lỗi tạo thumbnail PDF:", e);
                          }
                        }
                      }, 500);
                    }
                  }}
                />
              </div>
            );
          })}
        </Document>
      </div>

      {/* ===== CONTROL BAR ===== */}
      <div className="absolute left-6 bottom-6 bg-[#2f2b36] text-white rounded-md p-3 flex items-center gap-3 shadow-lg z-50">
        <button onClick={onPrev} className="p-1 hover:bg-white/10 rounded disabled:opacity-50" disabled={currentPageIndex <= 1}>
          <ChevronLeft size={18} />
        </button>
        <div className="bg-white text-black px-3 py-0.5 rounded text-sm font-medium">
          {currentPageIndex} / {numPages}
        </div>
        <button onClick={onNext} className="p-1 hover:bg-white/10 rounded disabled:opacity-50" disabled={currentPageIndex >= numPages}>
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
        <button onClick={() => onRotatePage(90)} className="p-1 hover:bg-white/10 rounded">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}