"use client";
import { X, Building } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import FolderTree from "@/components/layout/sidebar/FolderTree";

interface ExplorerViewProps {
  projectId: string;
  widthClass: string;
  onClose: () => void;
  isRootActive: boolean;
  dataPath: string;
}

export default function ExplorerView({
  projectId,
  widthClass,
  onClose,
  isRootActive,
  dataPath,
}: ExplorerViewProps) {
  return (
    <aside
      className={cn(
        "bg-[#F0F4F6] text-[#0F2332] flex flex-col h-full overflow-y-auto select-none font-sans text-sm border-r border-slate-700/50 transition-all duration-300",
        widthClass
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-[#1D3F52] text-white">
        <span className="font-bold text-xs uppercase tracking-wider truncate">
          Folder Tree
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
        <Link
          href={dataPath}
          className={cn(
            "flex items-center gap-3 px-4 py-4 text-sm transition-colors",
            isRootActive
              ? "bg-[#1D3F52]/10 text-[#1D3F52] font-bold"
              : "text-[#0F2332] hover:text-[#1D3F52] hover:bg-[#1D3F52]/5"
          )}
        >
          <Building
            size={16}
            className={isRootActive ? "text-[#0F2332]" : "text-[#0F2332]"}
          />
          <span className="font-semibold text-sm">The Building</span>
        </Link>
        <FolderTree projectId={projectId} parentId={null} />
      </div>
    </aside>
  );
}
