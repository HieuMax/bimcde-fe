// bimcde-fe/components/features/view2DManagement/createModel/createView.tsx
"use client";

import { useState, useEffect } from "react";

export default function CreateViewPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  // Định nghĩa đúng kiểu dữ liệu callback để truyền ngược lên cha
  onSave: (data: { name: string; description: string; createdBy?: string }) => void;
}) {
  // Quản lý state cho các ô nhập liệu
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // (Optional) State cho share - chưa dùng ngay nhưng để sẵn UI
  const [shareWith, setShareWith] = useState("");

  // Lấy user hiện tại từ localStorage/auth
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

  const handleSave = () => {
    // 1. Validate dữ liệu
    if (!name.trim()) {
      alert("Vui lòng nhập tên View!");
      return;
    }

    // 2. Truyền dữ liệu ra ngoài cho viewHome xử lý (gọi API)
    onSave({ 
      name: name.trim(), 
      description: description.trim(),
      createdBy: currentUser || "Unknown"
    });
  };

  return (
    <aside className="w-80 h-full bg-white shadow flex flex-col">
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
          className="text-gray-400 hover:text-gray-700 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
        {/* Input Name */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter view name"
            autoFocus
          />
        </div>

        {/* Input Description */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe what this view represents"
          />
        </div>

        {/* Input Share (UI Only - Logic chưa đấu nối) */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Share with
          </label>
          <input
            value={shareWith}
            onChange={(e) => setShareWith(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter users or groups"
          />
          <div className="mt-1 text-xs text-gray-500">
            Optional – leave empty to keep private
          </div>
        </div>

        {/* Current User Display */}
        {currentUser && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
            Created by: <span className="font-medium text-gray-700">{currentUser}</span>
          </div>
        )}
      </div>

      {/* FOOTER */}
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