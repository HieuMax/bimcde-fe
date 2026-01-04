'use client';

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';

/* ===== TYPES ===== */
export interface DetailItem {
  id?: string;
  name: string;
  description?: string;
  previewSrc?: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export type DetailsPostPayload =
  | { name: string; description?: string }
  | { comment: string };

type DetailsPanelProps = {
  item: DetailItem;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  onPost: (data: DetailsPostPayload) => void;
  onClose?: () => void;
};

export default function DetailsPanel({
  item,
  comment,
  setComment,
  onPost,
  onClose,
}: DetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    name: item.name ?? '',
    description: item.description ?? '',
  });

  const handleSaveEdit = () => {
    onPost({
      name: editFields.name,
      description: editFields.description,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditFields({
      name: item.name ?? '',
      description: item.description ?? '',
    });
    setIsEditing(false);
  };

  return (
    <aside className="w-[320px] shadow bg-white flex flex-col overflow-auto border-l border-slate-300">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 bg-gray-100 overflow-hidden rounded">
            {item.previewSrc && (
              <img
                src={item.previewSrc}
                alt="thumb"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <div className="text-lg font-semibold">{item.name}</div>
            <div className="text-xs text-gray-500">{item.modifiedOn}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded hover:bg-gray-100"
            title="Edit details"
          >
            <Pencil size={16} />
          </button>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            ✕
          </button>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4 flex-1 overflow-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>

        {!isEditing && (
          <div className="text-sm text-gray-600 space-y-3">
            <div>
              <div className="font-medium">Description</div>
              <div>{item.description ?? '--'}</div>
            </div>
            <div>
              <div className="font-medium">Created</div>
              <div>
                {item.createdOn ?? '--'}{' '}
                {item.createdBy && `By ${item.createdBy}`}
              </div>
            </div>
            <div>
              <div className="font-medium">Modified</div>
              <div>
                {item.modifiedOn ?? '--'}{' '}
                {item.modifiedBy && `By ${item.modifiedBy}`}
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                value={editFields.name}
                onChange={(e) =>
                  setEditFields((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full border mt-1 p-2 rounded text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editFields.description}
                onChange={(e) =>
                  setEditFields((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                className="w-full border mt-1 p-2 rounded text-sm h-20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-2 rounded border text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMMENT */}
      <div className="p-4 border-t border-slate-300">
        <div className="text-sm font-medium mb-2">Add a comment</div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-2 rounded text-sm"
          placeholder="Add a comment..."
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onPost({ comment });
              setComment('');
            }}
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
          >
            Post
          </button>
          <button
            onClick={() => setComment('')}
            className="px-3 py-2 rounded border text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </aside>
  );
}
