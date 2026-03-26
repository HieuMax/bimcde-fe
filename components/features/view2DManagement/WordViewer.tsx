"use client";

import React from "react";
import { X, MoreVertical, FileText, Download, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VersionHistoryPanelProps {
  file: any; 
  currentThumbnail?: string;
  onClose: () => void;
  onOpenVersion?: (version: any) => void;
  onDownloadVersion?: (version: any) => void;
}

export default function VersionHistoryPanel({
  file,
  currentThumbnail,
  onClose,
  onOpenVersion,
  onDownloadVersion,
}: VersionHistoryPanelProps) {
  if (!file) return null;

  // Lấy danh sách versions từ dữ liệu thật của file
  const versions = file.versions && file.versions.length > 0 
    ? [...file.versions].sort((a, b) => b.version - a.version) 
    : [
        {
          version: file.currentVersion || 1,
          location: file.location || file.fileUrl,
          uploadedBy: file.modifiedBy || file.createdBy,
          createdAt: file.updatedAt || file.createdAt
        }
      ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderThumbnail = (url?: string) => {
    if (!url) return <FileText className="text-slate-300" size={20} />;
    
    if (url.startsWith("data:image")) {
      return <img src={url} alt="thumbnail" className="w-full h-full object-cover" />;
    }

    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes(".pdf")) {
      return (
        <div className="flex flex-col items-center justify-center text-red-500">
          <FileText size={18} />
          <span className="text-[8px] font-bold mt-0.5">PDF</span>
        </div>
      );
    }
    
    if (lowerUrl.includes(".doc") || lowerUrl.includes(".docx")) {
      return (
        <div className="flex flex-col items-center justify-center text-blue-600">
          <FileText size={18} />
          <span className="text-[8px] font-bold mt-0.5">DOCX</span>
        </div>
      );
    }

    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
      return <img src={url} alt="thumbnail" className="w-full h-full object-cover" />;
    }

    return <FileText className="text-slate-400" size={20} />;
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white shrink-0">
        <h2 className="text-lg font-medium text-gray-800">Version history</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 transition-colors rounded-full p-1 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY - SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No version history found.
          </div>
        ) : (
          <div className="flex flex-col">
            {versions.map((ver: any, index: number) => {
              const isCurrent = ver.version === (file.currentVersion || versions[0].version);
              const authorName = typeof ver.uploadedBy === 'string' 
                ? ver.uploadedBy 
                : (ver.uploadedBy?.fullName || "Admin");

              return (
                <div
                  key={ver.version || index}
                  className={`flex gap-3 p-3 border-b border-gray-100 transition-colors ${
                    isCurrent ? "bg-[#eef4f9]" : "hover:bg-gray-50"
                  }`}
                >
                  {/* 👇 GỌI HÀM RENDER THUMBNAIL Ở ĐÂY */}
                  <div className="w-14 h-10 bg-slate-50 border border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden rounded-sm">
                    {/* Ưu tiên lấy URL từ ver.location, nếu không có mới fallback về previewSrc */}
                    {renderThumbnail(ver.location || file.previewSrc || file.fileUrl)}
                  </div>

                  {/* Info Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-sm truncate">
                      <span className="font-semibold text-[#005a9e]">
                        V.{ver.version}
                      </span>
                      <span className="text-gray-600 ml-1">• {file.name}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 truncate">
                      {authorName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(ver.createdAt || ver.date)}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="flex-shrink-0 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded outline-none transition-colors bg-gray-200/50">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-lg">
                        <DropdownMenuItem
                          className="cursor-pointer py-2"
                          onClick={() => onOpenVersion?.(ver)}
                        >
                          <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer py-2 text-[#005a9e]"
                          onClick={() => onDownloadVersion?.(ver)}
                        >
                          <Download className="w-4 h-4 mr-2 text-[#005a9e]" />
                          Download original
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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