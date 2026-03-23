'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useRef, useEffect } from 'react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerClient({ src, currentPageIndex }: { src: string, currentPageIndex: number }) {
  const [numPages, setNumPages] = useState(0);
  
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = pageRefs.current.get(currentPageIndex);
    const container = containerRef.current;

    if (targetElement && container) {

      const topPos = targetElement.offsetTop; 
      
      container.scrollTo({
        top: topPos - 24,
        behavior: 'smooth'
      });
    }
  }, [currentPageIndex]);

  return (
    <div className="w-full h-full relative bg-[#6b6a73] overflow-hidden">
      <div 
        ref={containerRef}
        className="absolute inset-0 flex justify-center overflow-auto py-4"
      >
        <div className="w-full max-w-215">
          <Document
            file={src}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="text-white mt-10 text-center">Đang tải tài liệu...</div>}
            className="flex flex-col items-center"
          >
            {Array.from({ length: numPages }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <div 
                  key={`pdf-main-${pageNum}`}
                  // Lưu ref của từng trang
                  ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
                  className="mb-4 shadow-2xl bg-white"
                >
                  <Page
                    pageNumber={pageNum}
                    width={830}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="w-207.5 h-275 bg-white animate-pulse" />
                    }
                  />
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    </div>
  );
}