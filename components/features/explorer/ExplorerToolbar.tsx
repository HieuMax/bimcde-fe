"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IFolder, ViewMode } from "@/types/explorer";
import UploadFileDialog from "./dialogs/UploadFileDialog";
import {
  LayoutGrid,
  List,
  RefreshCw,
  ChevronRight,
  Home,
  FolderPlus,
  Box,
  FileUp,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  currentFolder: IFolder | null;
  ancestors?: {
    _id: string;
    name: string;
  }[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onCreateFolderClick: () => void;
  onUpload: (files: File[]) => Promise<void>;
  projectId: string; // Thêm projectId
}

export default function ExplorerToolbar({
  currentFolder,
  ancestors = [],
  viewMode,
  setViewMode,
  onRefresh,
  isLoading,
  onCreateFolderClick,
  onUpload,
  projectId,
}: Props) {
  // 2. State quản lý đóng mở Dialog Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // ... (các hàm create folder cũ giữ nguyên) ...

  const handleUploadFiles = () => {
    // 3. Mở Dialog khi click menu item
    setIsUploadOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 sticky top-0 z-10">
        <nav className="flex items-center text-sm text-slate-600 overflow-hidden">
          {/* 1. Nút Home (Root) */}
          <Link
            href={`/projects/${projectId}/data`}
            className={`
              flex items-center hover:bg-slate-100 p-1.5 rounded transition-colors
              ${
                !currentFolder
                  ? "font-semibold text-slate-900 bg-slate-100"
                  : ""
              }
            `}
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* 2. Loop qua danh sách cha (Ancestors) */}
          {ancestors.map((folder) => (
            <div key={folder._id} className="flex items-center shrink-0">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />
              <Link
                href={`/projects/${projectId}/data?folderId=${folder._id}`}
                className="hover:bg-slate-100 px-2 py-1 rounded transition-colors truncate max-w-[150px] hover:text-blue-600"
                title={folder.name}
              >
                {folder.name}
              </Link>
            </div>
          ))}

          {/* 3. Folder hiện tại (Không click được, in đậm) */}
          {currentFolder && (
            <div className="flex items-center min-w-0">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />
              <span
                className="font-semibold text-slate-900 px-2 py-1 truncate"
                title={currentFolder.name}
              >
                {currentFolder.name}
              </span>
            </div>
          )}
        </nav>

        {/* VIEW ACTIONS */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-gray-700"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${
                viewMode === "grid"
                  ? "bg-white shadow-sm text-gray-700"
                  : "text-slate-500"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className={isLoading ? "animate-spin" : ""}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </Button>

          {/* --- NÚT NEW VỚI DROPDOWN MENU --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#406D87] hover:bg-[#345a70] px-6 py-4 rounded text-base font-medium flex items-center transition-colors disabled:opacity-50 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                New
              </Button>
            </DropdownMenuTrigger>
            {/* align="end" để menu căn lề phải với nút bấm */}
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={onCreateFolderClick}
                className="cursor-pointer"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>Create folder</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={handleCreate3DModel}
                className="cursor-pointer"
              >
                <Box className="mr-2 h-4 w-4" />
                <span>Create 3D model</span>
              </DropdownMenuItem>
              {/* Đường kẻ ngang */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleUploadFiles}
                className="cursor-pointer"
              >
                <FileUp className="mr-2 h-4 w-4" />
                <span>Upload files</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <UploadFileDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUpload={onUpload}
      />
    </>
  );
}
