"use client";

import { useState } from "react";
import { IFile, IFolder } from "@/types/explorer";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder as FolderIcon, LockKeyhole } from "lucide-react";
import FileIcon from "./FileIcon";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SortConfig } from "./ViewList";
import {
  resolveExplorerFileThumbnailSrc,
  shellFileThumbnailKey,
  isLikelyRasterImageUrl,
} from "@/lib/explorer/fileThumbnail";

interface Props {
  folders: IFolder[];
  files: IFile[];
  selectedIds: string[];
  onRowClick: (item: IFolder | IFile) => void;
  onCheckboxClick: (item: IFolder | IFile) => void;
  onMultiSelect: (items: (IFolder | IFile)[]) => void;
  onNavigate: (item: IFolder | IFile) => void;
  sortConfig: SortConfig;
  onSort: (key: "name" | "date" | "size") => void;
}

// --- COMPONENT: DRAGGABLE CARD ---
function DraggableCard({
  item,
  isSelected,
  onCardClickWithEvent,
  onCheckboxClick,
}: {
  item: IFile | IFolder;
  isSelected: boolean;
  onCardClickWithEvent: (e: React.MouseEvent, item: IFolder | IFile) => void;
  onCheckboxClick: (item: IFolder | IFile) => void;
}) {
  const isFolder = "totalSize" in item;
  const itemBlocked = (item as any).cdeAccessible === false;
  const isFileLocked = !isFolder && (item as IFile).isLocked;

  // --- LOGIC DND ---
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: item._id,
    data: { item, type: isFolder ? "folder" : "file" },
    disabled: itemBlocked,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item._id,
    data: { item },
    disabled: !isFolder || itemBlocked,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const handleCardInteraction = (e: React.MouseEvent) => {
    onCardClickWithEvent(e, item);
  };

  const handleCheckboxInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemBlocked) return;
    onCheckboxClick(item);
  };

  // --- RENDER FOLDER ---
  if (isFolder) {
    return (
      <div
        ref={setNodeRef}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        {...attributes}
        {...listeners}
        onClick={handleCardInteraction}
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 bg-white select-none",
          itemBlocked
            ? "cursor-not-allowed bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            : cn(
              "cursor-pointer",
              isSelected
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-slate-200 hover:bg-slate-50 hover:shadow-sm",
            ),
          isOver && "ring-2 ring-blue-400 bg-blue-100",
        )}
      >
        {/* Checkbox Area */}
        <div className="flex items-center justify-center size-5 shrink-0 relative">
          {!itemBlocked && (
            <Checkbox
              checked={isSelected}
              onClick={handleCheckboxInteraction}
              className={cn(
                "size-5 transition-opacity z-20",
                isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 absolute",
              )}
            />
          )}
          {/* Folder Icon: */}
          <FolderIcon
            className={cn(
              "size-5 transition-opacity",
              itemBlocked
                ? "text-slate-400 fill-slate-300"
                : "text-slate-600 fill-slate-600",
              isSelected ? "opacity-0" : "group-hover:opacity-0",
            )}
          />
          {itemBlocked && !isSelected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="rounded-full bg-white/95 p-1 shadow-sm border border-slate-200">
                <LockKeyhole className="size-3.5 text-slate-600" />
              </span>
            </div>
          )}
        </div>

        <span
          className={cn(
            "truncate text-sm font-medium flex-1",
            itemBlocked ? "text-slate-500" : "text-slate-700",
          )}
          title={item.name}
        >
          {item.name}
        </span>
      </div>
    );
  }

  // --- RENDER FILE  ---
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      className="relative h-full"
    >
      <Card
        onClick={handleCardInteraction}
        className={cn(
          "h-full cursor-pointer group relative overflow-hidden transition-all duration-200 border hover:shadow-md flex flex-col select-none",
          {
            "border-blue-500 bg-blue-50/30 ring-1 ring-blue-500": isSelected,
            "border-slate-200 hover:border-blue-300": !isSelected,
          },
        )}
      >
        {/* PREVIEW AREA */}
        <div className="aspect-[4/3] w-full bg-slate-50 flex items-center justify-center overflow-hidden relative border-b border-slate-100">
          {(() => {
            const f = item as IFile;
            const shellSrc = resolveExplorerFileThumbnailSrc(f);
            const showRaster =
              f.mimeType?.startsWith("image/") ||
              isLikelyRasterImageUrl(shellSrc);
            if (showRaster && shellSrc !== "/placeholder-image.png") {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={shellFileThumbnailKey(f)}
                  src={shellSrc}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              );
            }
            return (
              <FileIcon
                mimeType={f.mimeType}
                className="size-16 opacity-80"
              />
            );
          })()}

          {/* Locked Indicator */}
          {isFileLocked && (
            <div className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm z-10">
              <LockKeyhole className="size-3 text-orange-500" />
            </div>
          )}
        </div>

        {/* INFO AREA */}
        <div className="p-3 bg-white flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            {/* WRAPPER CHO ICON/CHECKBOX */}
            <div className="flex items-center justify-center size-5 shrink-0 relative">
              {/* Checkbox */}
              <Checkbox
                checked={isSelected}
                onClick={handleCheckboxInteraction}
                className={cn(
                  "size-5 transition-opacity z-20 absolute top-0 left-0",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
              />
              {/* Icon */}
              <div
                className={cn(
                  "transition-opacity duration-200",
                  isSelected ? "opacity-0" : "group-hover:opacity-0",
                )}
              >
                <FileIcon
                  mimeType={(item as IFile).mimeType}
                  className="size-5"
                />
              </div>
            </div>

            {/* File Name */}
            <span
              className="truncate text-sm font-medium text-slate-700 w-full"
              title={item.name}
            >
              {item.name}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ViewGrid({
  folders,
  files,
  selectedIds,
  onRowClick,
  onCheckboxClick,
  onMultiSelect,
  onNavigate,
  sortConfig,
  onSort,
}: Props) {
  const allItems = [...folders, ...files];

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const isBlockedItem = (i: IFolder | IFile) =>
    (i as any).cdeAccessible === false;

  const handleCardClickWithEvent = (
    e: React.MouseEvent,
    item: IFolder | IFile,
  ) => {
    const currentIndex = allItems.findIndex((i) => i._id === item._id);

    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== -1) {
      e.preventDefault();
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const itemsToSelect = allItems
        .slice(start, end + 1)
        .filter((i) => !isBlockedItem(i));
      onMultiSelect(itemsToSelect);
      setLastSelectedIndex(currentIndex);
      return;
    }

    if (isBlockedItem(item)) return;

    if (e.ctrlKey || e.metaKey) {
      onCheckboxClick(item);
    } else {
      onNavigate(item);
    }

    setLastSelectedIndex(currentIndex);
  };

  if (!allItems.length)
    return <div className="p-10 text-center text-slate-400">Empty folder</div>;

  return (
    <div className="pb-20 space-y-8 select-none">
      {" "}
      {/* select-none để tránh bôi đen text khi shift click */}
      {/* SECTION 1: FOLDERS */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider px-1">
            Folders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <DraggableCard
                key={folder._id}
                item={folder}
                isSelected={selectedIds.includes(folder._id)}
                onCardClickWithEvent={handleCardClickWithEvent}
                onCheckboxClick={onCheckboxClick}
              />
            ))}
          </div>
        </div>
      )}
      {/* SECTION 2: FILES */}
      {files.length > 0 && (
        <div className="space-y-3">
          {folders.length > 0 && (
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider px-1">
              Files
            </h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <DraggableCard
                key={file._id}
                item={file}
                isSelected={selectedIds.includes(file._id)}
                onCardClickWithEvent={handleCardClickWithEvent}
                onCheckboxClick={onCheckboxClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
