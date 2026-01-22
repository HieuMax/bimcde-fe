'use client';

import dynamic from 'next/dynamic';
import ImageViewer from './imageViewer';
import { useMemo } from 'react';
import { IFile } from '@/types/explorer';

const PdfViewerClient = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-700 flex items-center justify-center text-white">
      Loading PDF...
    </div>
  ),
});

interface FileViewportProps {
  file: IFile | null;
  currentSrc: string | null;
  pageIndex: number;

  zoom: number;
  pageRotation: number;

  onZoom: (d: number) => void;
  onRotatePage: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function FileViewport({
  file,
  currentSrc,
  pageIndex,
  zoom,
  pageRotation,
  onZoom,
  onRotatePage,
  onPrev,
  onNext,
}: FileViewportProps) {
  const { viewType, finalUrl } = useMemo(() => {
    const isImageMode =
      currentSrc && !currentSrc.toLowerCase().endsWith('.pdf');

    const rawUrl = isImageMode
      ? currentSrc
      : file?.fileUrl ?? currentSrc ?? '';

    return {
      viewType: isImageMode ? 'IMAGE' : 'PDF',
      finalUrl: rawUrl,
    };
  }, [file, currentSrc]);

  /* ===== IMAGE ===== */
  // if (viewType === 'IMAGE' && finalUrl) {
  //   return (
  //     <ImageViewer
  //       src={finalUrl}
  //       zoom={zoom}
  //       rotate={pageRotation}
  //       pageIndex={pageIndex}
  //       totalPages={1}
  //       onZoom={onZoom}
  //       onRotate={onRotatePage}
  //       onPrev={onPrev}
  //       onNext={onNext}
  //     />
  //   );
  // }

  /* ===== PDF ===== */
  // if (viewType === 'PDF' && finalUrl) {
  //   return (
  //     <div className="flex-1 relative w-full h-full bg-gray-700">
  //       <PdfViewerClient
  //         src={finalUrl}
  //         currentPageIndex={pageIndex}
  //         zoom={zoom}
  //         pageRotation={pageRotation}
  //         onRotatePage={onRotatePage}
  //         onZoom={onZoom}
  //         onPrev={onPrev}
  //         onNext={onNext}
  //       />
  //     </div>
  //   );
  // }

  // return (
  //   <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-400">
  //     Select a document
  //   </div>
  // );
    return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ===== IMAGE ===== */}
      {viewType === 'IMAGE' && finalUrl && (
        <ImageViewer
          src={finalUrl}
          zoom={zoom}
          rotate={pageRotation}
          pageIndex={pageIndex}
          totalPages={1}
          onZoom={onZoom}
          onRotate={onRotatePage}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}

      {/* ===== PDF ===== */}
      {viewType === 'PDF' && finalUrl && (
        <PdfViewerClient
          src={finalUrl}
          currentPageIndex={pageIndex}
          zoom={zoom}
          pageRotation={pageRotation}
          onRotatePage={onRotatePage}
          onZoom={onZoom}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}

      {!finalUrl && (
        <div className="flex h-full items-center justify-center text-gray-400">
          Select a document
        </div>
      )}
    </div>
  );

}
