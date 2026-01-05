"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fileService } from "@/services/file.service";
import { IFile } from "@/types/explorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolType } from "@/types/tool";

import {
  Eye,
  Download,
  Info,
  FileText,
  Calendar,
  User,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Toolbar from "./Toolbar";
import SidebarView from "@/components/layout/SideBarView";
import FileViewer from "@/components/features/explorer/properties/components/views/FileViewer";
import { useEffect, useRef, useState } from "react";

// --- Helper Functions ---
const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("vi-VN");
};

export default function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>();

  const { data: file, isLoading } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => fileService.getById(fileId),
    enabled: !!fileId,
  });

  const [activeTool, setActiveTool] = useState<ToolType>("cursor");

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  if (!file)
    return (
      <div className="flex h-full items-center justify-center">
        File not found
      </div>
    );

  const latestVersion = file.versions[file.versions.length - 1];
  const uploaderName =
    typeof latestVersion.uploadedBy === "object"
      ? (latestVersion.uploadedBy as any).fullName ||
        (latestVersion.uploadedBy as any).email
      : "Unknown";

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Sidebar View */}
      <div className="h-full border-r bg-white shrink-0 z-10">
        <SidebarView />
      </div>

      {/* Toolbar */}
      <div className="h-full border-r bg-white shrink-0 z-10">
        <Toolbar activeTool={activeTool} onToolSelect={setActiveTool} />
      </div>

      {/* Main Content: File Viewer */}
      <div className="flex-1 h-full flex flex-col bg-stone-700 relative overflow-hidden">
        {/* Chỉ cần gọi Component này, rất gọn */}
        <FileViewer file={file} activeTool={activeTool} />
      </div>

      {/* 3. Info panel (Sliding Drawer Right) */}
      <div
        className="
          fixed top-24 right-0 z-20 h-[calc(100%-6rem)] w-80
          border-l bg-background/95 backdrop-blur shadow-2xl
          flex flex-col gap-4 p-4
          translate-x-[calc(100%-12px)] hover:translate-x-0
          transition-transform duration-300 ease-in-out
          rounded-l-xl border-y
        "
      >
        {/* Thanh cầm (Handle) để người dùng biết có thể hover */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-12 bg-gray-300 rounded-full" />

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg font-bold break-words">
              {file.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
              <Info className="w-4 h-4" />
              <span>Thông tin chi tiết</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Kích thước</p>
                  <p className="font-medium">
                    {formatSize(latestVersion.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Người tải lên</p>
                  <p className="font-medium">{uploaderName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Ngày cập nhật</p>
                  <p className="font-medium">
                    {formatDate(latestVersion.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <a
                href={latestVersion.location}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Tải xuống
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
