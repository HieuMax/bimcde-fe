'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function WordViewerClient({
  src,
  zoom,
  onZoom,
  pageIndex = 1,
  onPrev,
  onNext,
  onLoadSuccess,
  onPageChange,
  onPageThumbnailGenerated
}: {
  src: string;
  zoom: number;
  onZoom: (d: number) => void;
  pageIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (total: number) => void;
  onPageThumbnailGenerated?: (index: number, src: string) => void; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const pageRefs = useRef<HTMLElement[]>([]);

  // Các Ref dùng để kiểm soát cuộn trang
  const scrollContainerRef = useRef<HTMLDivElement>(null); 
  const isScrollDriven = useRef(false);
  const currentPageIndexRef = useRef(pageIndex);

  // 🌟 LUÔN ĐỒNG BỘ INDEX HIỆN TẠI VÀO REF
  useEffect(() => {
    currentPageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    let isMounted = true;
    const loadDocx = async () => {
      if (!containerRef.current || !src) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Không thể tải file Word');
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
            
            // 🌟 1. ĐÁNH DẤU SỐ TRANG CHO TỪNG PHẦN TỬ ĐỂ OBSERVER NHẬN DIỆN
            sections.forEach((section, idx) => {
               section.setAttribute('data-page-number', (idx + 1).toString());
            });

            const total = sections.length > 0 ? sections.length : 1;
            
            pageRefs.current = sections;
            setTotalPages(total);
            
            try {
              if (onLoadSuccess) onLoadSuccess(total);
            } catch (cbErr) {
              console.warn("Lỗi đồng bộ trang:", cbErr);
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
                  console.warn(`Lỗi tạo thumbnail trang ${i + 1}`);
                }
              }
            };
            setTimeout(generateThumbnails, 1000);
          }
        }
      } catch (err) {
        console.error('Lỗi khi render Word:', err);
        if (isMounted) setError('Một số hình ảnh hoặc liên kết phức tạp có thể không hiển thị được.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocx();
    return () => { isMounted = false; };
  }, [src]);

  // 🌟 2. THÊM OBSERVER ĐỂ THEO DÕI KHI CUỘN CHUỘT
  useEffect(() => {
    if (!scrollContainerRef.current || pageRefs.current.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum && pageNum !== currentPageIndexRef.current) {
              isScrollDriven.current = true; // Đánh dấu là do user cuộn chuột
              onPageChange?.(pageNum); // Báo về Control Bar nhảy số
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '-40% 0px -40% 0px', // Vùng nhận diện ở giữa màn hình
      }
    );

    pageRefs.current.forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, [totalPages, zoom, onPageChange]);

  // 🌟 3. LOGIC CUỘN MƯỢT CÓ CHỐNG GIẬT
  useEffect(() => {
    // Nếu trang nhảy số do cuộn chuột thì KHÔNG scrollIntoView nữa (Tránh giật trang)
    if (isScrollDriven.current) {
      isScrollDriven.current = false;
      return;
    }

    // Nếu do bấm nút Next/Prev trên Control Bar -> Cuộn đến trang đó
    if (pageRefs.current.length > 0 && pageIndex > 0) {
      const targetPage = pageRefs.current[pageIndex - 1]; 
      if (targetPage && scrollContainerRef.current) {
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

      {/* 🌟 4. GẮN THÊM REF VÀO VIEWPORT CONTAINER */}
      <div 
        className="absolute inset-0 overflow-auto scroll-smooth"
        ref={scrollContainerRef}
      >
        <div
          style={{ zoom: zoom } as React.CSSProperties}
          ref={containerRef}
        />
      </div>

      {/* ===== CONTROL BAR ===== */}
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 bg-[#2f2b36] text-white rounded-md px-3 py-2 flex items-center gap-3 shadow-lg z-50">
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
      </div>
    </div>
  );
}