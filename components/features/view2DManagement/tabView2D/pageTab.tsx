"use client";

import React from "react";
import Image from "next/image";
import { Document, Page } from "react-pdf";
import { Virtuoso } from "react-virtuoso";
import { PageItem } from "@/types/view";

interface PagesTabProps {
  pages: PageItem[];
  currentPageIndex: number;
  onSelectPage: (item: PageItem) => void;
  pdfUrl?: string | null;
}

export default function PagesTab({
  pages,
  currentPageIndex,
  onSelectPage,
  pdfUrl,
}: PagesTabProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 ">
        <h3 className="text-lg font-semibold mb-3 uppercase tracking-wider">
          Pages ({pages.length})
        </h3>
      </div>

      <div className="flex-1 min-h-0">
        <Virtuoso
          style={{ height: "100%" }}
          data={pages}
          itemContent={(index, p) => {
            const displayNum = p.pageNumber ?? p.index;
            const isActive = displayNum === currentPageIndex;

            return (
              <div className="px-4 py-2">
                <div
                  onClick={() => onSelectPage(p)}
                  className={`cursor-pointer rounded border p-2 flex flex-col items-center bg-white transition-all
                    ${isActive ? "border-blue-600 shadow-md ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-400"}
                  `}
                >
                  <div className="w-full h-45 bg-white flex items-center justify-center overflow-hidden border border-gray-100">
                    {p.imageSrc ? (
                      <Image
                        src={p.imageSrc}
                        className="w-full h-full object-contain"
                        alt={`Page ${displayNum}`}
                        width={140}
                        height={200}
                      />
                    ) : pdfUrl ? (
                      <Document file={pdfUrl} loading="...">
                        <Page
                          pageNumber={p.pageNumber || index + 1}
                          width={140}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    ) : (
                      <div className="text-xs text-gray-400">No preview</div>
                    )}
                  </div>
                  <div
                    className={`mt-2 text-[11px] font-bold ${isActive ? "text-blue-600" : "text-gray-500"}`}
                  >
                    Trang {displayNum}
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
