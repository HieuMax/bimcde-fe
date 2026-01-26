'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Document, Page } from 'react-pdf';
import { Virtuoso } from 'react-virtuoso';
import { RotateCcw, RotateCw } from 'lucide-react';
import { PageItem } from '@/types/view';

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
  const [pageRotations, setPageRotations] =
    useState<Record<number, number>>({});

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
      <div className="px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Pages ({pages.length})
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => rotateActivePage(-90)}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Rotate left"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => rotateActivePage(90)}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Rotate right"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {showRotateNote && (
        <div className="px-4 py-2">
          <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2">
            Please note: Saving page rotation is currently not supported
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Virtuoso
          style={{ height: '100%' }}
          data={pages}
          itemContent={(index, p) => {
            const pageNumber = p.pageNumber ?? p.index;
            const isActive = pageNumber === currentPageIndex;
            const rotation = pageRotations[pageNumber] ?? 0;

            return (
              <div className="px-4 py-2">
                <div
                  onClick={() => onSelectPage(p)}
                  className={`
                    cursor-pointer rounded border p-2 bg-white transition
                    ${isActive
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-400'}
                  `}
                >
                  <div className="w-full h-auto flex items-center justify-center overflow-hidden border border-gray-100 bg-white">
                    <div
                      style={{ transform: `rotate(${rotation}deg)` }}
                      className="transition-transform"
                    >
                      {p.imageSrc ? (
                        <Image
                          src={p.imageSrc}
                          alt={`Page ${pageNumber}`}
                          width={140}
                          height={200}
                          className="object-contain"
                        />
                      ) : pdfUrl ? (
                        <Document file={pdfUrl} loading={null}>
                          <Page
                            pageNumber={pageNumber}
                            width={140}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                      ) : (
                        <div className="text-xs text-gray-400">
                          No preview
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`mt-2 text-[11px] font-bold text-center ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {pageNumber}
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
