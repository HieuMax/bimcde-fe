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

interface PdfViewerClientProps {
  src: string;
  currentPageIndex: number;
  zoom: number;

  pageRotation: number;
  onRotatePage: (delta: number) => void;

  onZoom: (delta: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function PdfViewerClient({
  src,
  currentPageIndex,
  zoom,
  pageRotation,
  onRotatePage,
  onZoom,
  onPrev,
  onNext,
}: PdfViewerClientProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  /* ===== OBSERVE CONTAINER WIDTH (KEY FIX) ===== */
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  /* ===== SCROLL TO ACTIVE PAGE ===== */
  useEffect(() => {
    const el = pageRefs.current.get(currentPageIndex);
    if (el && containerRef.current) {
      containerRef.current.scrollTo({
        top: el.offsetTop - 24,
        behavior: 'smooth',
      });
    }
  }, [currentPageIndex]);

  if (!src) {
    return (
      <div className="flex items-center justify-center h-full text-white bg-gray-800">
        Link file không tồn tại
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-[#6b6a73]">

      {/* ===== PDF SCROLL AREA ===== */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto"
      >
        <div className="flex flex-col items-center gap-6 py-6">
          <Document
            file={src}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="text-white mt-10 animate-pulse">
                Đang tải tài liệu...
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center mt-20 p-6 bg-white rounded-lg shadow-lg text-red-600">
                <p className="font-bold text-lg mb-2">
                  ⚠️ Không thể hiển thị tài liệu
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Đường dẫn file bị hỏng hoặc không có quyền truy cập.
                </p>
                <div className="text-xs bg-gray-100 p-2 rounded border break-all max-w-md">
                  URL: {src}
                </div>
              </div>
            }
          >
            {Array.from({ length: numPages }).map((_, i) => {
              const pageNumber = i + 1;

              return (
                <div
                  key={pageNumber}
                  ref={(el) => {
                    if (el) pageRefs.current.set(pageNumber, el);
                  }}
                  className="flex justify-center"
                >
                  <div className="bg-white shadow-xl">
                    <Page
                      pageNumber={pageNumber}
                      width={containerWidth * zoom}
                      rotate={
                        pageNumber === currentPageIndex
                          ? pageRotation
                          : 0
                      }
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      </div>

      {/* ===== CONTROL BAR ===== */}
      <div
        className="
          absolute left-1/2 bottom-6
          -translate-x-1/2
          bg-[#2f2b36] text-white
          rounded-md px-4 py-3
          flex items-center gap-3
          shadow-lg
          z-50
        "
      >
        <button onClick={onPrev} className="p-2 hover:bg-white/10 rounded">
          <ChevronLeft size={18} />
        </button>

        <div className="bg-white text-black px-3 rounded text-sm font-medium">
          {currentPageIndex} / {numPages}
        </div>

        <button onClick={onNext} className="p-2 hover:bg-white/10 rounded">
          <ChevronRight size={18} />
        </button>

        <div className="border-l h-6 opacity-40 mx-2" />

        <button onClick={() => onZoom(-0.1)} className="p-2 hover:bg-white/10 rounded">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => onZoom(0.1)} className="p-2 hover:bg-white/10 rounded">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => onRotatePage(90)} className="p-2 hover:bg-white/10 rounded">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

// 'use client';

// import { Document, Page, pdfjs } from 'react-pdf';
// import { useEffect, useRef, useState } from 'react';
// import {
//   ZoomIn,
//   ZoomOut,
//   RotateCcw,
//   ChevronLeft,
//   ChevronRight,
// } from 'lucide-react';

// pdfjs.GlobalWorkerOptions.workerSrc =
//   `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// interface PdfViewerClientProps {
//   src: string;
//   currentPageIndex: number;
//   zoom: number;

//   pageRotation: number;
//   onRotatePage: (delta: number) => void;

//   onZoom: (delta: number) => void;
//   onPrev: () => void;
//   onNext: () => void;
// }

// export default function PdfViewerClient({
//   src,
//   currentPageIndex,
//   zoom,
//   pageRotation,
//   onRotatePage,
//   onZoom,
//   onPrev,
//   onNext,
// }: PdfViewerClientProps) {
//   const [numPages, setNumPages] = useState<number>(0);

//   const containerRef = useRef<HTMLDivElement>(null);
//   const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

//   /* ===== SCROLL TO ACTIVE PAGE ===== */
//   useEffect(() => {
//     const el = pageRefs.current.get(currentPageIndex);
//     if (el && containerRef.current) {
//       containerRef.current.scrollTo({
//         top: el.offsetTop - 24,
//         behavior: 'smooth',
//       });
//     }
//   }, [currentPageIndex]);

//   if (!src) {
//         return <div className="flex items-center justify-center h-full text-white bg-gray-800">Link file không tồn tại</div>;
//     }
//   return (
//     <div className="w-full h-full relative bg-[#6b6a73]">
//       {/* ===== PDF SCROLL AREA ===== */}
//       <div
//         ref={containerRef}
//         className="absolute inset-0 overflow-auto"
//       >
//         <div className="flex flex-col items-center gap-6">
//           <Document
//             file={src}
//             onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//             // [THÊM] Xử lý hiển thị khi đang tải
//             loading={
//                 <div className="text-white mt-10 animate-pulse">
//                     Đang tải tài liệu...
//                 </div>
//             }
            
//             // [THÊM] Xử lý hiển thị khi lỗi (QUAN TRỌNG)
//             error={
//                 <div className="flex flex-col items-center justify-center mt-20 p-6 bg-white rounded-lg shadow-lg text-red-600">
//                     <p className="font-bold text-lg mb-2">⚠️ Không thể hiển thị tài liệu</p>
//                     <p className="text-sm text-gray-600 mb-4">Đường dẫn file bị hỏng hoặc không có quyền truy cập.</p>
//                     <div className="text-xs bg-gray-100 p-2 rounded border break-all max-w-md">
//                         URL: {src}
//                     </div>
//                 </div>
//             }
//           >
//             {Array.from({ length: numPages }).map((_, i) => {
//               const pageNumber = i + 1;

//               return (
//                 <div
//                   key={pageNumber}
//                   ref={(el) => {
//                     if (el) pageRefs.current.set(pageNumber, el);
//                   }}
//                   className="flex flex-col items-center m-4"
//                 >

//                   <div className="bg-white shadow-xl">
//                     <Page
//                       pageNumber={pageNumber}
//                       scale={zoom}
//                       rotate={
//                         pageNumber === currentPageIndex
//                           ? pageRotation
//                           : 0
//                       }
//                       width={900}
//                       renderTextLayer={false}
//                       renderAnnotationLayer={false}
//                     />
//                   </div>
//                 </div>
//               );
//             })}
//           </Document>
//         </div>
//       </div>

//       {/* ===== CONTROL BAR ===== */}
//       <div
//         className="
//           absolute left-1/2 bottom-6
//           -translate-x-1/2
//           bg-[#2f2b36] text-white
//           rounded-md px-4 py-3
//           flex items-center gap-3
//           shadow-lg
//           z-50
//         "
//       >
//         <button onClick={onPrev} className="p-2 hover:bg-white/10 rounded">
//           <ChevronLeft size={18} />
//         </button>

//         <div className="bg-white text-black px-3 rounded text-sm font-medium">
//           {currentPageIndex} / {numPages}
//         </div>

//         <button onClick={onNext} className="p-2 hover:bg-white/10 rounded">
//           <ChevronRight size={18} />
//         </button>

//         <div className="border-l h-6 opacity-40 mx-2" />

//         <button onClick={() => onZoom(-0.1)} className="p-2 hover:bg-white/10 rounded">
//           <ZoomOut size={16} />
//         </button>
//         <button onClick={() => onZoom(0.1)} className="p-2 hover:bg-white/10 rounded">
//           <ZoomIn size={16} />
//         </button>
//         <button onClick={() => onRotatePage(90)} className="p-2 hover:bg-white/10 rounded">
//           <RotateCcw size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }
