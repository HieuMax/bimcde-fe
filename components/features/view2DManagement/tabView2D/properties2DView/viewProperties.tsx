import React, { useState, useEffect } from "react";
import { ViewItem } from "@/types/view";
import { X, Calendar, User, Info, Save, Globe, Lock } from "lucide-react";
import { format } from "date-fns";

interface ViewDetailPanelProps {
  view: ViewItem;
  onClose: () => void;
  onSave: (updatedView: ViewItem) => void;
}

export default function ViewDetailPanel({
  view,
  onClose,
  onSave,
}: ViewDetailPanelProps) {
  // State quản lý việc chỉnh sửa
  const [localName, setLocalName] = useState(view.name);
  const [localDesc, setLocalDesc] = useState(view.description || "");
  const [isPublic, setIsPublic] = useState(view.sharedWith?.isPublic || false);

  // Cập nhật lại state nếu view thay đổi (khi chọn view khác từ sidebar)
  useEffect(() => {
    setLocalName(view.name);
    setLocalDesc(view.description || "");
    setIsPublic(view.sharedWith?.isPublic || false);
  }, [view]);

  const handleSaveClick = () => {
    // Tạo object mới chứa các thông tin đã sửa để gửi đi
    const updatedData: ViewItem = {
      ...view,
      name: localName,
      description: localDesc,
      sharedWith: {
        ...view.sharedWith,
        isPublic: isPublic,
      },
    };
    onSave(updatedData);
  };

  const creatorName = view.createdBy?.fullName || "Unknown";

  return (
    <div className="w-80 h-full bg-white border-l shadow-xl flex flex-col absolute right-0 top-0 z-[60]">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Info size={16} /> Edit View
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* View Name Input */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">
            View Name
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full text-sm font-medium text-gray-900 mt-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">
            Description
          </label>
          <textarea
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            className="w-full text-sm text-gray-700 mt-1 border rounded px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Enter description..."
          />
        </div>

        {/* Permission Toggle */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">
            Privacy
          </label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded text-xs font-medium transition ${!isPublic ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-600"}`}
            >
              <Lock size={14} /> Private
            </button>
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded text-xs font-medium transition ${isPublic ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-600"}`}
            >
              <Globe size={14} /> Public
            </button>
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase">
              Created By
            </label>
            <div className="text-xs text-gray-600 truncate">{creatorName}</div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase">
              Date
            </label>
            <div className="text-xs text-gray-600">
              {view.createdAt
                ? format(new Date(view.createdAt), "dd/MM/yyyy")
                : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveClick}
          className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}
