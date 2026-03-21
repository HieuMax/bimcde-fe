"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerClient({
  src,
  currentPageIndex,
}: {
  src: string;
  currentPageIndex: number;
}) {
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="w-full h-full relative bg-[#6b6a73] overflow-hidden flex justify-center">
      <div className="absolute inset-0 flex justify-center overflow-auto py-4 custom-scrollbar">
        <div className="w-full max-w-max flex justify-center">
          <Document
            file={src}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="text-white mt-10 text-center">
                Đang tải tài liệu...
              </div>
            }
            className="flex flex-col items-center"
          >
            {/* CHỈ HIỂN THỊ ĐÚNG 1 TRANG HIỆN TẠI */}
            {numPages > 0 && currentPageIndex <= numPages && (
              <div className="mb-4 shadow-2xl bg-white relative">
                <Page
                  pageNumber={currentPageIndex}
                  width={830}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="w-[830px] h-[1100px] bg-white animate-pulse flex items-center justify-center">
                      <span className="text-gray-400">
                        Loading page {currentPageIndex}...
                      </span>
                    </div>
                  }
                />
              </div>
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}
