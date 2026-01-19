"use client";

import { useState } from "react";

export interface CreateViewFormData {
  title: string;
  description: string;
  sharedWith: string;
}

export default function CreateViewPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: CreateViewFormData) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sharedWith, setSharedWith] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    onSave({
      title,
      description,
      sharedWith,
    });
  };

  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col border-l border-gray-200 z-50 absolute right-0 top-0 bottom-0">
      <div className="px-5 py-4 border-b border-gray-300 flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-gray-900">
            Create View
          </div>
          <div className="text-xs text-gray-500">
            Save current viewport as a new view
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter view name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe what this view represents"
          />
        </div>

        {/* Share With - Optional */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Share with{" "}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter users or groups"
          />
          <div className="mt-1 text-xs text-gray-500">
            Leave empty to keep private
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </aside>
  );
}
