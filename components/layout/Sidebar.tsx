"use client";

import { useState } from "react";
import {
  FolderOpen,
  Home,
  Settings,
  ChevronRight,
  Layers,
  Database,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation"; // 1. Import useParams
import { cn } from "@/lib/utils";
import FolderTree from "@/components/features/explorer/sidebar/FolderTree";

export default function Sidebar() {
  // 2. Lấy projectId từ URL
  const params = useParams();
  const projectId = params?.projectId as string;
  const pathname = usePathname();

  // State để toggle phần Folder Tree
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true); // Mặc định nên mở explorer
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // Nếu không có projectId (ví dụ đang ở trang list projects), có thể hiển thị loading hoặc UI khác
  if (!projectId) return null;

  if (pathname?.includes("/files/")) return null;

  return (
    <aside className="w-64 bg-[#004B7D] text-white flex flex-col h-screen border-r border-slate-700 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
      {/* Header: Project Name */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded">
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        {/* Có thể thay thế bằng tên project thật nếu fetch API */}
        <h1 className="font-bold text-lg truncate">
          Project {projectId.slice(0, 6)}...
        </h1>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {/* Link thường: All Projects - Thoát ra danh sách dự án */}
        <SidebarItem
          icon={<Home size={18} />}
          label="All Projects"
          href="/projects"
        />

        {/* Link thường: Data - Đi vào trang Data của project này */}
        <SidebarItem
          icon={<Database size={18} />}
          label="Permissions"
          href={`/projects/${projectId}/permissions`}
        />

        {/* --- EXPLORER SECTION (Special) --- */}
        <div className="mt-2">
          {/* Dòng tiêu đề Explorer */}
          <div
            className={cn(
              "group flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors border-l-4 border-transparent",
              // Highlight nếu đang mở
              isExplorerExpanded ? "bg-white/10 border-l-blue-300" : ""
            )}
          >
            {/* Phần bên trái: Link về trang gốc của Explorer */}
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-3 flex-1"
            >
              <FolderOpen size={18} className="text-white" />
              <span className="font-medium">Explorer</span>
            </Link>

            {/* Phần bên phải: Nút Toggle Tree */}
            <div
              onClick={(e) => {
                e.preventDefault(); // Tránh kích hoạt Link
                setIsExplorerExpanded(!isExplorerExpanded);
              }}
              className="p-1 rounded hover:bg-white/20 ml-2"
            >
              {isExplorerExpanded ? (
                <FolderOpen size={16} className="fill-white/30" />
              ) : (
                <ChevronRight size={16} className="text-white/70" />
              )}
            </div>
          </div>

          {/* TREE VIEW AREA */}
          {isExplorerExpanded && (
            <div className="bg-[#003f69] pb-2 shadow-inner">
              {/* Truyền projectId động vào FolderTree */}
              <FolderTree projectId={projectId} parentId={null} />
            </div>
          )}
        </div>
        {/* ------------------------------- */}

        <SidebarItem
          icon={<Layers size={18} />}
          label="Topics"
          href={`/projects/${projectId}/topics`}
        />
        <SidebarItem
          icon={<Users size={18} />}
          label="Details"
          href={`/projects/${projectId}/details`}
        />
        <SidebarItem
          icon={<Layers size={18} />}
          label="units"
          href={`/projects/${projectId}/units`}
        />
        {/* --- SETTINGS SECTION --- */}
        <div className="mt-1">
          <div
            className={cn(
              "group flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors border-l-4 border-transparent",
              isSettingsExpanded ? "bg-white/10 border-l-blue-300" : ""
            )}
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span className="font-normal">Settings</span>
            </div>

            <ChevronRight
              size={16}
              className={cn(
                "text-white/70 transition-transform",
                isSettingsExpanded && "rotate-90"
              )}
            />
          </div>

          {isSettingsExpanded && (
            <div className="bg-[#003f69] py-1 shadow-inner">
              <Link
                href={`/projects/${projectId}/tags`}
                className="flex items-center gap-3 px-8 py-2 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              >
                <div className="w-1 h-1 rounded-full bg-white/50" />
                <span>Tags</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

// Helper Component
function SidebarItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-white/80 hover:text-white border-l-4 border-transparent hover:border-l-white/50"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
