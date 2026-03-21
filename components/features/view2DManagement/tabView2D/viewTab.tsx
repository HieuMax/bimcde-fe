"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, MoreVertical, Eye, RotateCcw, Trash2 } from "lucide-react";
import { ViewItem } from "@/types/view";
import { format } from "date-fns";
import { toast } from "sonner"; // Hoặc react-hot-toast tùy dự án của bạn

type ViewsTabProps = {
  views: ViewItem[];
  currentUser: string;
  onSelectView: (view: ViewItem) => void;
  onCreateView: () => void;
  onDeleteView?: (view: ViewItem) => void;
};

export default function ViewsTab({
  views,
  currentUser,
  onSelectView,
  onCreateView,
  onDeleteView,
}: ViewsTabProps) {
  const [filter, setFilter] = useState<"all" | "me">("all");

  // State quản lý Menu Dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  //filter
  const filtered =
    filter === "me"
      ? views.filter((v) => v.createdBy?._id === currentUser)
      : views;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 uppercase tracking-wider">
          Views ({views.length})
        </h3>
        <button
          onClick={onCreateView}
          className="flex items-center gap-1 px-2 py-1
                     rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
          title="Create View"
        >
          <Camera size={14} />
          <span>New</span>
        </button>
      </div>

      {/* FILTER OPTION */}
      <div className="p-2 border-b">
        <select
          className="w-full rounded border border-gray-300 px-2 py-1
                     text-xs focus:outline-none focus:border-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "mine")}
        >
          <option value="all">All views</option>
          <option value="mine">Created by me</option>
        </select>
      </div>

      {/* DANH SÁCH VIEW THEO DẠNG GRID CARD */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-400 gap-2">
            <Camera size={32} strokeWidth={1.5} />
            <span className="text-xs">No saved views</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((v) => {
              if (!v) return null;

              // Xử lý hiển thị an toàn
              const creatorName =
                v.createdBy?._id === currentUser
                  ? "Me"
                  : v.createdBy?.fullName || v.createdBy?.email || "Unknown";
              const isMenuOpen = activeMenuId === v._id;

              return (
                <div
                  key={v._id}
                  className="group relative border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* A. Thumbnail Section */}
                  <div
                    className="aspect-video w-full bg-gray-100 rounded-t-lg overflow-hidden relative cursor-pointer"
                    onClick={() => onSelectView(v)}
                  >
                    {v.thumbnailUrl ? (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Camera size={20} />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-tr">
                      {v.createdAt
                        ? format(new Date(v.createdAt), "dd/MM")
                        : ""}
                    </div>
                  </div>

                  {/* B. Info Footer */}
                  <div className="p-2 flex items-start justify-between bg-white rounded-b-lg">
                    <div
                      className="min-w-0 flex-1 cursor-pointer mr-1"
                      onClick={() => onSelectView(v)}
                    >
                      <div
                        className="text-xs font-semibold text-gray-800 truncate"
                        title={v.name}
                      >
                        {v.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        by {creatorName}
                      </div>
                    </div>

                    {/* Option button */}
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuClick(e, v._id)}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-gray-200 shadow-xl rounded-md z-50 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onSelectView(v);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left w-full"
                          >
                            <Eye size={12} className="text-blue-500" /> See
                            details
                          </button>

                          <button
                            onClick={() => {
                              onSelectView(v);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left w-full"
                          >
                            <RotateCcw size={12} className="text-orange-500" />{" "}
                            Load original
                          </button>

                          <div className="h-px bg-gray-100 my-0.5" />

                          <button
                            onClick={() => {
                              if (onDeleteView) onDeleteView(v);
                              else
                                toast.error("Delete function not implemented");
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left w-full"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
