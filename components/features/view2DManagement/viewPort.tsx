'use client';

import dynamic from 'next/dynamic';
import { useMemo, useEffect, useState } from 'react';
import ImageViewer from './imageViewer';
import { IFile } from '@/types/explorer';

const PdfViewerClient = dynamic(() => import('./PdfViewer'), { ssr: false });

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
  onRendered
}: {
  file: IFile | null;
  currentSrc: string | null;
  pageIndex: number;
  zoom: number;
  pageRotation: number;
  onZoom: (d: number) => void;
  onRotatePage: (d: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onRendered?: () => void;

}) {
  const [isViewLoading, setIsViewLoading] = useState(false);

  const { type, url } = useMemo(() => {
    if (!file) return { type: null, url: null };
    if (file.fileType === 'PDF') {
      return { type: 'PDF', url: file.fileUrl };
    }
    return { type: 'IMAGE', url: currentSrc || file.fileUrl };
  }, [file, currentSrc]);

  useEffect(() => {
    if (!isViewLoading) return;

    const t = setTimeout(() => {
      console.warn('Force stop view loading');
      setIsViewLoading(false);
    }, 8000);

    return () => clearTimeout(t);
  }, [isViewLoading]);

  if (!file || !url) return null;

  return (
    <div className="absolute inset-0 bg-neutral-800">
      {/* ===== VIEWER ===== */}
      {type === 'PDF' && (
        <PdfViewerClient
          src={url}
          currentPageIndex={pageIndex}
          zoom={zoom}
          pageRotation={pageRotation}
          onZoom={onZoom}
          onRotatePage={onRotatePage} 
          onPrev={onPrev}
          onNext={onNext}
          onPageRendered={onRendered}
        />
      )}

      {type === 'IMAGE' && (
        <ImageViewer
          src={url}
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
    </div>
  );
}