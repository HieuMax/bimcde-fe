'use client';

import { FileItem } from '@/app/types/api';
import PdfViewerClient from './PdfViewer';
import ImageViewer from './imageViewer'; 
import { useMemo } from 'react';

interface FileViewportProps {
  file: FileItem | null;
  currentSrc: string | null;
  pageIndex: number;
  zoom: number;
  rotate: number;
  onZoom: (d: number) => void;
  onRotate: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function FileViewport({
  file,
  currentSrc,
  pageIndex,
  zoom,
  rotate,
  onZoom,
  onRotate,
  onPrev,
  onNext,
}: FileViewportProps) {
  
  // LOGIC URL & CACHE BUSTING
  const { viewType, finalUrl, uniqueKey } = useMemo(() => {

    const isImageMode = currentSrc && !currentSrc.toLowerCase().endsWith('.pdf');
    
    const rawUrl = isImageMode ? currentSrc : (file?.fileUrl ?? currentSrc ?? '');
    
    const cacheBuster = `t=${Date.now()}`;
    const urlWithCache = rawUrl.includes('?') 
      ? `${rawUrl}&${cacheBuster}` 
      : `${rawUrl}?${cacheBuster}`;

    return {
      viewType: isImageMode ? 'IMAGE' : 'PDF',
      finalUrl: urlWithCache,
      uniqueKey: `${rawUrl}-${cacheBuster}`
    };
  }, [file, currentSrc]);

  // CASE 1: IMAGE VIEWER (Ưu tiên)
  if (viewType === 'IMAGE') {
    return (
      <ImageViewer
        key={uniqueKey}
        src={finalUrl}
        zoom={zoom}
        rotate={rotate}
        pageIndex={pageIndex}
        totalPages={1}
        onZoom={onZoom}
        onRotate={onRotate}
        onPrev={onPrev}
        onNext={onNext}
      />
    );
  }

  // CASE 2: PDF VIEWER
  if (finalUrl && finalUrl.length > 10) { 
    return (
      <div className='flex-1 relative w-full h-full bg-gray-700'>
        <PdfViewerClient 
          key={uniqueKey} 
          src={finalUrl}
          currentPageIndex={pageIndex} 
        />
      </div>
    );
  }

  return <div className="flex-1 bg-gray-200 flex items-center justify-center text-gray-400">Select a document</div>;
}