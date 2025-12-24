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
        <Loader2 className="h-3 w-3 animate-spin text-white/50" />
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
    router.push(`/projects/${projectId}?folderId=${folder._id}`);
  };

  return (
    <div>
      {/* Folder Row */}
      <div
        className={cn(
          "flex items-center py-1.5 pr-2 cursor-pointer hover:bg-white/10 transition-colors select-none text-sm text-white/80 hover:text-white",
          isActive && "bg-white/20 text-white font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleNavigate}
      >
        <div
          onClick={handleToggle}
          className={cn(
            "mr-1 p-0.5 rounded cursor-pointer transition-colors",
            hasChildren ? "hover:bg-white/20" : "opacity-0 cursor-default" // Ẩn nếu không có con
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
            isOpen ? "text-white" : "text-white/70"
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
