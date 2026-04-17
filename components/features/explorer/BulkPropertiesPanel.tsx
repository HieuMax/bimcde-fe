// components/features/explorer/BulkPropertiesPanel.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IFile,
  IFolder,
  CdeWorkflowMode,
  CdeCapabilities,
} from "@/types/explorer";
import { getIsoMoveRestrictEffectiveGroupId } from "@/lib/explorer/isoMove";
import {
  Download,
  Trash2,
  X,
  FolderInput,
  Lock,
  Unlock,
  Tags,
  Eye,
} from "lucide-react";
import FileIcon from "./views/FileIcon";
import { Folder } from "lucide-react";
import MoveDestinationView from "./MoveDestinationView";
import TagsView from "./properties/views/TagsView";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface Props {
  selectedItems: (IFile | IFolder)[];
  onClose: () => void;
  onDeselectItem: (id: string) => void;
  // Actions
  onDownload: () => void;
  onDelete: () => void;
  onToggleLock: (action: "LOCK" | "UNLOCK") => void;
  onMoveItems: (destinationId: string) => Promise<void>;
  projectId: string;
  workflowMode?: CdeWorkflowMode;
  cdeCapabilities?: CdeCapabilities;
}

export default function BulkPropertiesPanel({
  selectedItems,
  onClose,
  onDeselectItem,
  onDownload,
  onDelete,
  onToggleLock,
  onMoveItems,
  projectId,
  workflowMode = "NORMAL",
  cdeCapabilities,
}: Props) {
  const [view, setView] = useState<"list" | "move" | "tags">("list");
  const queryClient = useQueryClient();
  const router = useRouter();

  const isIso = workflowMode === "ISO_19650";
  const showBulkCheckinCheckout =
    !isIso || !!cdeCapabilities?.isProjectAdmin;
  const selectionIsAllFiles =
    selectedItems.length > 0 &&
    selectedItems.every((item) => "mimeType" in item);

  const isoMoveGroup = getIsoMoveRestrictEffectiveGroupId(
    workflowMode,
    selectedItems,
  );

  if (view === "move") {
    if (isoMoveGroup === "mixed") {
      return (
        <div className="flex flex-col h-full bg-white border-l p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Move to...</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            In ISO 19650 mode, you can only move items that belong to the same
            group together. Your selection includes items from different groups.
          </p>
          <Button variant="outline" onClick={() => setView("list")}>
            Back
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full bg-white border-l">
        <MoveDestinationView
          title="Move to..."
          onBack={() => setView("list")}
          onClose={onClose}
          onMove={onMoveItems}
          sourceItemIds={selectedItems.map((i) => i._id)}
          projectId={projectId}
          workflowMode={workflowMode}
          restrictMoveToEffectiveGroupId={
            isoMoveGroup === null ? null : isoMoveGroup
          }
          parentCdeRootStage={
            selectedItems[0] &&
            "parentCdeRootStage" in selectedItems[0]
              ? selectedItems[0].parentCdeRootStage ?? null
              : null
          }
        />
      </div>
    );
  }

  if (view === "tags") {
    // Filter files and folders
    const fileIds = selectedItems
      .filter((item) => !("totalSize" in item))
      .map((item) => item._id);

    const folderIds = selectedItems
      .filter((item) => "totalSize" in item)
      .map((item) => item._id);

    return (
      <div className="flex flex-col h-full bg-white border-l">
        <TagsView
          fileIds={fileIds}
          folderIds={folderIds}
          onBack={() => setView("list")}
          onClose={onClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["explorer"] });
          }}
          projectId={projectId}
        />
      </div>
    );
  }


  const handleViewFile = () => {
    if (selectedItems.length > 1) {
      let urls = [];
      for (const item of selectedItems) {
        const fileExt = (item as IFile).name
          .toString()
          .split(".")
          .pop()
          ?.toLowerCase();
        if (!fileExt) continue;
        const IFC_FILES = ["ifc"];
        // IFC → 3D Viewer

        if (IFC_FILES.includes(fileExt)) {
          urls.push((item as IFile).location);
        }
      }

      if (urls.length === 0) return;
      router.push(
        `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(JSON.stringify(urls))}`
      );
      return;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          {selectedItems.length} SELECTED ITEMS
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-5 w-5 text-slate-400" />
        </Button>
      </div>

      {/* ACTIONS LIST */}
      <div className="p-4 space-y-2 border-b">
        {selectionIsAllFiles && (
          <Button
            onClick={handleViewFile}
            className="bg-slate-800 hover:bg-slate-700 text-white h-9 px-4 text-sm font-medium mr-auto"
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
          onClick={onDownload}
        >
          <Download className="h-5 w-5" />
          Download
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100 font-medium"
          onClick={() => setView("move")}
        >
          <FolderInput className="h-5 w-5" />
          Move to...
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100 font-medium"
          onClick={() => setView("tags")}
        >
          <Tags className="h-5 w-5" />
          Add Tags
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" />
          Delete
        </Button>

        {showBulkCheckinCheckout && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
              onClick={() => onToggleLock("LOCK")}
            >
              <Lock className="h-5 w-5" />
              Checkin file(s) (Lock)
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
              onClick={() => onToggleLock("UNLOCK")}
            >
              <Unlock className="h-5 w-5" />
              Checkout file(s) (Unlock)
            </Button>
          </>
        )}
      </div>

      {/* SELECTED ITEMS LIST */}
      <div className="p-4 pb-2">
        <h3 className="text-sm font-medium text-slate-900 mb-2">
          Selected items
        </h3>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {selectedItems.map((item) => {
            const isFolder = "totalSize" in item;
            return (
              <div
                key={item._id}
                className="flex items-center justify-between group py-2 hover:bg-slate-50 rounded px-1 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Icon bé */}
                  {isFolder ? (
                    <Folder className="size-5 text-yellow-500 fill-yellow-500 shrink-0" />
                  ) : (
                    <FileIcon
                      mimeType={(item as IFile).mimeType}
                      className="size-5 shrink-0"
                    />
                  )}
                  <span className="text-sm text-slate-700 truncate">
                    {item.name}
                  </span>
                </div>

                {/* X Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                  onClick={() => onDeselectItem(item._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
