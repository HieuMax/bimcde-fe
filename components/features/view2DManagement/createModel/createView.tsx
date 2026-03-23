"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CreateViewPanelProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    createdBy?: string;
    sharedWithUsers?: string;
  }) => Promise<void>;
}

export default function CreateViewPanel({
  onClose,
  onSave,
}: CreateViewPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shareWith, setShareWith] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Lấy user hiện tại (logic của bạn – GIỮ)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user.fullName || user.email || "Unknown");
      }
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên View!");
      return;
    }

    try {
      setIsSubmitting(true);

      await onSave({
        name: name.trim(),
        description: description.trim(),
        createdBy: currentUser || "Unknown",
        sharedWithUsers: shareWith,
      });
      // parent sẽ tự đóng panel sau khi save thành công
    } catch (error) {
      console.error("Failed to create view:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col border-l border-gray-200">
      {/* HEADER */}
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
          aria-label="Close"
          disabled={isSubmitting}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        {/* Name */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter view name"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       resize-none"
            placeholder="Describe what this view represents"
            disabled={isSubmitting}
          />
        </div>

        {/* Share */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Share with
          </label>
          <input
            value={shareWith}
            onChange={(e) => setShareWith(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2
                       text-gray-700 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter users or groups (comma separated)"
            disabled={isSubmitting}
          />
          <div className="mt-1 text-xs text-gray-500">
            Optional – leave empty to keep private
          </div>
        </div>

        {/* Current User */}
        {currentUser && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
            Created by:{" "}
            <span className="font-medium text-gray-700">{currentUser}</span>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 rounded border border-gray-300
                     text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="px-4 py-2 rounded bg-blue-600
                     text-sm font-medium text-white
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </aside>
  );
}
