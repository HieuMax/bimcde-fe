'use client';

import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfImageViewer({
  src,
  pageNumber,
  scale,
  rotate,
}: {
  src: string;
  pageNumber: number;
  scale: number;
  rotate: number;
}) {
  return (
    <div className="flex-1 bg-[#6b6a73] flex justify-center overflow-auto">
      <Document file={src}>
        <Page
          pageNumber={pageNumber}
          scale={scale}
          rotate={rotate}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
