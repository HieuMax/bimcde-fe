'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function WordViewerClient({
  src,
  zoom,
  onZoom,
  pageIndex = 1,
  onPrev,
  onNext,
  onLoadSuccess,
  onPageThumbnailGenerated,
  onRotatePage,
}: {
  src: string;
  zoom: number;
  onZoom: (d: number) => void;
  pageIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onLoadSuccess?: (total: number) => void;
  onPageThumbnailGenerated?: (index: number, src: string) => void; 
  onRotatePage: (d: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const pageRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDocx = async () => {
      if (!containerRef.current || !src) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Unable to load Word file');
        const blob = await response.blob();

        if (isMounted && containerRef.current) {
          await renderAsync(blob, containerRef.current, undefined, {
            className: 'docx-document',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            experimental: true,
          });

          if (containerRef.current) {
            const sections = Array.from(containerRef.current.querySelectorAll('section'));
            const total = sections.length > 0 ? sections.length : 1;
            
            pageRefs.current = sections;
            setTotalPages(total);
            
            try {
              if (onLoadSuccess) onLoadSuccess(total);
            } catch (cbErr) {
              console.warn("Page synchronization error:", cbErr);
            }
            const generateThumbnails = async () => {
              for (let i = 0; i < sections.length; i++) {
                if (!isMounted) break; 
                try {
                  const canvas = await html2canvas(sections[i], {
                    scale: 0.25, 
                    useCORS: true,
                    logging: false,
                  });
                  const thumbSrc = canvas.toDataURL("image/jpeg", 0.6);
                  
                  if (onPageThumbnailGenerated) {
                    onPageThumbnailGenerated(i + 1, thumbSrc);
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                } catch (e) {
                  console.warn(`Page thumbnail creation error ${i + 1}`);
                }
              }
            };
            setTimeout(generateThumbnails, 1000);
          }
        }
      } catch (err) {
        console.error('Error when rendering Word:', err);
        if (isMounted) setError('Some complex images or links may not display.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDocx();
    return () => { isMounted = false; };
  }, [src]);

  useEffect(() => {
    if (pageRefs.current.length > 0 && pageIndex > 0) {
      const targetPage = pageRefs.current[pageIndex - 1]; 
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [pageIndex]);

  return (
    <div className="w-full h-full relative bg-[#6b6a73] overflow-hidden">
      <style>{`
        .docx-wrapper {
          background: transparent !important;
          padding: 2rem !important;
          display: flex;
          flex-direction: column; 
          align-items: center;
          gap: 20px; 
          height: auto !important;      
          overflow: visible !important; 
        }
        .docx-document {
          background: white !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3) !important;
          min-height: 297mm; 
          width: 210mm !important; 
          padding: 20mm !important; 
        }
      `}</style>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#6b6a73]/70 backdrop-blur-sm z-20">
          <div className="bg-white text-black px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Đang xử lý tài liệu...</span>
          </div>
        </div>
      )}
      
      {error && !loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-2 rounded shadow-md z-20 text-sm opacity-90 transition-opacity hover:opacity-100">
          {error}
        </div>
      )}

      {/* ===== VIEWPORT CONTAINER ===== */}
      <div className="absolute inset-0 overflow-auto scroll-smooth">
        <div
          style={{ zoom: zoom } as React.CSSProperties}
          ref={containerRef}
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
        <button onClick={() => onRotatePage(90)} className="p-1 hover:bg-white/10 rounded">
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}