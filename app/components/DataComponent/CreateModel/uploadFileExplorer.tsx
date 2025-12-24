// UploadFilesModal.tsx
'use client';
import React, { useCallback, useRef, useState } from 'react';
import { X, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected?: (files: FileList | File[]) => void;
  accept?: string;
  maxFiles?: number;
}

export default function UploadFilesModal({ isOpen, onClose, onFilesSelected, accept = "*", maxFiles = 20 }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const onDrop = (e: React.DragEvent) => {
    stop(e);
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length) {
      onFilesSelected?.(files);
      onClose();
    }
  };

  const onBrowse = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      onFilesSelected?.(files);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black opacity-30 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-md shadow-2xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload files</h3>
              <p className="text-sm text-gray-500 mt-1">You can select more than one file at a time.</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-md" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <div
              onDragOver={(e) => { stop(e); setIsDragOver(true); }}
              onDragEnter={(e) => { stop(e); setIsDragOver(true); }}
              onDragLeave={(e) => { stop(e); setIsDragOver(false); }}
              onDrop={onDrop}
              className={`w-full rounded-md border-2 border-dashed p-8 text-center ${isDragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-100 rounded-md">
                  <Upload size={28} className="text-gray-500" />
                </div>
                <div className="text-sm text-gray-700">Drag and drop files here</div>
                <div className="text-xs text-gray-400">PNG, JPG, PDF, DWG — multiple files allowed</div>
              </div>
            </div>

            <div className="py-6 text-center">
              <div className="text-sm text-gray-500">- or -</div>
              <button
                onClick={onBrowse}
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md shadow-sm hover:bg-gray-900 transition"
              >
                Browse
              </button>
            </div>

            <input ref={inputRef} type="file" className="hidden" multiple accept={accept} onChange={onFileChange} />
          </div>
        </div>
      </div>
    </>
  );
}
