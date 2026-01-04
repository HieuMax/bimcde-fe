"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { folderService } from "@/services/folder.service";
import { ChevronRight, ChevronDown, Folder, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { IFolder } from "@/types/explorer";

interface Folder {
  _id: string;
  name: string;
}

interface FolderTreeProps {
  projectId: string;
  parentId: string | null;
  level?: number;
}

export default function FolderTree({
  projectId,
  parentId,
  level = 0,
}: FolderTreeProps) {
  const { data: folders, isLoading } = useQuery({
    queryKey: ["folder-tree", projectId, parentId],
    queryFn: () => folderService.getFolders(projectId, parentId),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="pl-4 py-1">
        <Loader2 className="h-3 w-3 animate-spin text-[#1D3F52]" />
      </div>
    );
  }

  if (!folders || folders.length === 0) return null;

  return (
    <div className="flex flex-col">
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder._id}
          folder={folder}
          projectId={projectId}
          level={level}
        />
      ))}
    </div>
  );
}

function FolderTreeItem({
  folder,
  projectId,
  level,
}: {
  folder: IFolder;
  projectId: string;
  level: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFolderId = searchParams.get("folderId");
  const isActive = currentFolderId === folder._id;

  const hasChildren = folder.hasChildren;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const handleNavigate = () => {
    router.push(`/projects/${projectId}/data?folderId=${folder._id}`);
  };

  return (
    <div>
      {/* Folder Row */}
      <div
        className={cn(
          "flex items-center py-2.5 pr-2 cursor-pointer transition-colors select-none text-sm group",
          isActive
            ? "bg-[#1D3F52]/10 text-[#1D3F52] font-semibold" // Active
            : "text-[#0F2332] hover:bg-[#1D3F52]/5 hover:text-[#1D3F52]"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleNavigate}
      >
        <div
          onClick={handleToggle}
          className={cn(
            "mr-1 p-0.5 rounded cursor-pointer transition-colors",
            hasChildren
              ? "hover:bg-[#1D3F52]/10 hover:text-[#1D3F52]"
              : "opacity-0 cursor-default"
          )}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            ))}
          {!hasChildren && <div className="h-3.5 w-3.5" />}
        </div>

        {/* Icon Folder */}
        <Folder
          className={cn(
            "h-4 w-4 mr-2 fill-current",
            isActive || isOpen ? "text-[#1D3F52]" : "text-current"
          )}
        />
        <span className="truncate">{folder.name}</span>
      </div>

      {isOpen && hasChildren && (
        <FolderTree
          projectId={projectId}
          parentId={folder._id}
          level={level + 1}
        />
      )}
    </div>
  );
}
