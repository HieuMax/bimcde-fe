'use client';

import { useState, useEffect } from 'react';
import { ViewItem } from '@/types/view';
import { IFile } from '@/types/explorer'
import { Paperclip, Pencil, X } from 'lucide-react'

type Props = {
  file: IFile | null;
  view?: ViewItem | null;
};

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '--';
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDate(date?: string) {
  if (!date) return '--';
  return new Date(date).toLocaleDateString();
}

export default function FileDetailTab({ file }: Props) {

  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [name, setName] = useState(file?.name ?? '');
  const [tags, setTags] = useState('');
  
  const [isCommenting, setIsCommenting] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    console.log('DETAIL FILE', file?.location);
  }, [file]);
  
  if (!file) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No file selected
      </div>
    );
  }

  /* ================= EDIT MODE ================= */
  if (mode === 'edit') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            className="text-sm text-gray-600"
            onClick={() => setMode('view')}
          >
            ← Edit
          </button>

          <button
            className="text-xl text-gray-500"
            onClick={() => setMode('view')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-2 py-1 text-sm rounded"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Tags</div>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Begin typing to search..."
              className="w-full border px-2 py-1 text-sm rounded"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <button
            className="px-4 py-1 text-sm border rounded"
            onClick={() => setMode('view')}
          >
            Cancel
          </button>

          <button
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded"
            onClick={() => {
              console.log('SAVE', { name, tags });
              setMode('view');
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  /* ================= VIEW MODE ================= */
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="text-sm font-bold uppercase tracking-wider">
          {file.name}
        </div>

        <div className="flex items-center gap-3">
          <button
            className=" text-sm"
            onClick={() => setMode('edit')}
          >
            <Pencil size={18}/>
          </button>

          <button className="text-xl text-gray-500">
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 text-sm space-y-4 border-b">
        <h3 className="text-sm font-semibold">Details</h3>

        <DetailRow
          label="Version"
          value={file.currentVersion ? `v${file.currentVersion}` : '--'}
          actionLabel="See history"
        />

        <DetailRow
          label="Size"
          value={ formatFileSize(file.size) }
        />

        <DetailRow
          label="Location"
          value={file.location || file.projectName || "Project Root"}          
          valueClass="text-blue-600 font-medium"
        />

        <DetailRow
          label="Created"
          value={
            file.createdAt
              ? `${formatDate(file.createdAt)} by ${
                  typeof file.createdBy === 'string'
                    ? file.createdBy
                    : file.createdBy?? 'Unknown'
                }`
              : '--'
          }
        />

        <DetailRow
          label="Modified"
          value={
            file.updatedAt
              ? `${formatDate(file.updatedAt)} by ${
                  typeof file.modifiedBy === 'string'
                    ? file.modifiedBy
                    : file.modifiedBy ?? 'Unknown'
                }`
              : '--'
          }
        />

      </div>


      {/* ===== COMMENTS ===== */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 px-4 py-3" />

        <div className="border-t p-3">
          {!isCommenting ? (
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setIsCommenting(true)}
            >
              Add a comment...
            </button>
          ) : (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={3}
                autoFocus
              />

              <div className="flex items-center justify-between mt-2">
                <button className="text-xl text-gray-500">
                <Paperclip size={18}/>

                </button>

                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 text-sm border rounded"
                    onClick={() => {
                      setComment('');
                      setIsCommenting(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-1 text-sm bg-blue-600 text-white rounded"
                    disabled={!comment.trim()}
                    onClick={() => {
                      console.log('COMMENT', comment);
                      setComment('');
                      setIsCommenting(false);
                    }}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

/* ================= SUB ================= */

function DetailRow({
  label,
  value,
  actionLabel,
  valueClass,
}: {
  label: string;
  value?: string;
  actionLabel?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">
        {label}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={`text-sm ${valueClass || ''}`}>
          {value || '--'}
        </div>

        {actionLabel && (
          <button className="text-sm text-blue-600 hover:underline">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
