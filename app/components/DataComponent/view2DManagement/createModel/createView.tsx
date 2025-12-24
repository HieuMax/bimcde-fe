'use client';

import { ViewItem } from "@/app/types/api";

export default function CreateViewPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: ViewItem) => void;
}) {
  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col">
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
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter view name"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       resize-none"
            placeholder="Describe what this view represents"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Share with
          </label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2
                       text-gray-700 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter users or groups"
          />
          <div className="mt-1 text-xs text-gray-500">
            Optional – leave empty to keep private
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded border border-gray-300
                     text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          onClick={() => onSave({})}
          className="px-4 py-2 rounded bg-blue-600
                     text-sm font-medium text-white
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </aside>
  );
}
