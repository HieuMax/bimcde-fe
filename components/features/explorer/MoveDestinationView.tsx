// components/features/explorer/MoveDestinationView.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { explorerService } from "@/services/explorer.service";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, ChevronRight, ArrowLeft, Loader2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  onBack: () => void;
  onClose: () => void;
  onMove: (destinationFolderId: string) => Promise<void>;
  title?: string;
  sourceItemIds: string[];
  projectId: string;
}

export default function MoveDestinationView({
  onBack,
  onClose,
  onMove,
  title = "Move to...",
  sourceItemIds,
  projectId,
}: Props) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["explorer-move-nav", projectId, currentFolderId],
    queryFn: () => explorerService.getContent(projectId, currentFolderId),
  });

  const subFolders = data?.subFolders || [];
  const currentFolderName = data?.currentFolder?.name || "The Building (Root)";
  const parentId = data?.currentFolder?.parentId || null;

  const handleMoveClick = async () => {
    setIsMoving(true);
    try {
      await onMove(currentFolderId || "");
    } catch (error) {
      console.error(error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleBackNav = () => {
    if (!currentFolderId) {
      onBack();
    } else {
      setCurrentFolderId(parentId);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border h-[60px]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackNav}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground truncate max-w-[200px]">
            {title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Current Location Breadcrumb-ish */}
      <div className="px-4 py-2 border-b border-border bg-slate-50 text-sm font-medium text-slate-700">
        {currentFolderName}
      </div>

      {/* Warning Box */}
      <div className="bg-yellow-50 p-3 m-4 mb-2 rounded border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
        Please note: Folder(s) existing with same name in the destination folder
        will be ignored.
      </div>

      {/* Folder List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            subFolders.map((folder) => {
              const isDisabled = sourceItemIds.includes(folder._id);

              return (
                <div
                  key={folder._id}
                  onClick={() => !isDisabled && setCurrentFolderId(folder._id)}
                  className={`
                    flex items-center justify-between p-3 rounded cursor-pointer transition-colors
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-slate-50"
                        : "hover:bg-slate-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Folder className="size-5 text-slate-400 fill-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">
                      {folder.name}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              );
            })
          )}

          {!isLoading && subFolders.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-10">
              No sub-folders
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer: Move Button */}
      <div className="p-4 border-t border-border bg-white">
        <Button
          className="w-full bg-[#005F9E] hover:bg-[#004B7D]"
          onClick={handleMoveClick}
          disabled={isMoving}
        >
          {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Move here
        </Button>
      </div>
    </>
  );
}
