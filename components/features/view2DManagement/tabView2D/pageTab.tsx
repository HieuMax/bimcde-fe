'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Virtuoso } from 'react-virtuoso';
import { RotateCcw, RotateCw, FileText } from 'lucide-react'; 
import { PageItem } from '@/types/explorer'; 

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PagesTabProps {
  pages: PageItem[];
  currentPageIndex: number;
  pdfUrl?: string;
  onSelectPage: (item: PageItem) => void;
}

export default function PagesTab({
  pages,
  currentPageIndex,
  onSelectPage,
  pdfUrl,
}: PagesTabProps) {
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [showRotateNote, setShowRotateNote] = useState(false);

  const rotateActivePage = (delta: number) => {
    if (!currentPageIndex) return;

    setPageRotations((prev) => ({
      ...prev,
      [currentPageIndex]: ((prev[currentPageIndex] ?? 0) + delta) % 360,
    }));

    if (!showRotateNote) {
      setShowRotateNote(true);
    }
  };

  return (
    <div className="flex flex-col w-72 h-full bg-white border-r border-gray-200">
      {/* ===== HEADER ===== */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Pages ({pages.length})
        </h3>

        <div className="flex items-center gap-1">
          <button onClick={() => rotateActivePage(-90)} className="p-1.5 rounded hover:bg-gray-100" title="Rotate left">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => rotateActivePage(90)} className="p-1.5 rounded hover:bg-gray-100" title="Rotate right">
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {showRotateNote && (
        <div className="px-4 py-2 shrink-0">
          <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2 rounded">
            Please note: Saving page rotation is currently not supported
          </div>
        </div>
      )}

      {/* ===== LIST CONTENT ===== */}
      <div className="flex-1 min-h-0">
        <Virtuoso
          style={{ height: '100%' }}
          data={pages}
          itemContent={(index, p) => {
            const pageNumber = p.pageNumber ?? p.index;
            const isActive = pageNumber === currentPageIndex;
            const rotation = pageRotations[pageNumber] ?? 0;

            // Kiểm tra xem source có phải Word không
            const isWordSource = p.source === 'word';
            const hasRealImage = p.imageSrc && p.imageSrc.startsWith('data:image');
            const isPdfSource = p.source === 'pdf' || (!p.imageSrc && pdfUrl);

            return (
              <div className="px-4 py-3">
                <div
                  onClick={() => onSelectPage(p)}
                  className={`
                    cursor-pointer rounded-lg border p-2 bg-slate-50 transition-all duration-200
                    ${isActive
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-500 bg-white'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-white'
                    }
                  `}
                >
                  <div className="w-full flex justify-center items-center bg-white border border-gray-100 rounded overflow-hidden min-h-[160px]">
                    <div
                      style={{ transform: `rotate(${rotation}deg)` }}
                      className="transition-transform duration-300 w-full h-full flex justify-center items-center"
                    >
                      
                      {isWordSource && !hasRealImage ? (
                        /* GIAO DIỆN RIÊNG CHO FILE WORD (Luôn luôn hiển thị được) */
                        <div className="flex flex-col items-center justify-center w-full min-h-[160px] bg-blue-50/40">
                          <FileText size={54} strokeWidth={1.2} className="text-blue-600 mb-3" />
                          <span className="text-[10px] font-bold tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded shadow-sm uppercase">
                            DOCX FORMAT
                          </span>
                        </div>
                      ) : (!isPdfSource && p.imageSrc) || (isWordSource && hasRealImage) ? (
                        /* HIỂN THỊ ẢNH */
                        <img
                          src={p.imageSrc}
                          alt={`Page ${pageNumber}`}
                          className="max-w-[140px] max-h-[180px] w-auto h-auto object-contain py-2"
                          loading="lazy"
                        />
                      ) : isPdfSource && pdfUrl ? (
                        /* HIỂN THỊ THUMBNAIL PDF */
                        <Document 
                          file={pdfUrl} 
                          loading={<div className="text-xs text-gray-400 py-10">Loading...</div>}
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={140}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-sm"
                          />
                        </Document>
                      ) : (
                        /* TRƯỜNG HỢP LỖI */
                        <div className="text-xs text-gray-400 py-10">
                          Không có bản xem trước
                        </div>
                      )}

                    </div>
                  </div>

                  <div
                    className={`mt-2 text-xs font-semibold text-center ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Trang {pageNumber}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}