// CreateFolderModal.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  parentName?: string; // e.g. "The Building"
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateFolderModal({
  isOpen,
  parentName = 'Project',
  onClose,
  onCreate,
}: Props) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset input and focus after modal opens
    // setName('');
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onCreate(trimmed);
    setName(''); // safe to call here (user action)
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black opacity-30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full max-w-xl rounded-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Create Folder In <span className="font-medium text-gray-800">{parentName}</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Please enter a name for the new folder</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              id="folderName"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Name"
              className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
            <button
              type="button"
              onClick={() => { setName(''); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-md text-white ${name.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400/60 cursor-not-allowed'}`}
              disabled={!name.trim()}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
