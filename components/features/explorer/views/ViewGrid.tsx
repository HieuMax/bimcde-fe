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
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item._id,
    data: { item },
    disabled: !isFolder,
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
          "group relative flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200 bg-white select-none",
          isSelected
            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
            : "border-slate-200 hover:bg-slate-50 hover:shadow-sm",
          isOver && "ring-2 ring-blue-400 bg-blue-100"
        )}
      >
        {/* Checkbox Area */}
        <div className="flex items-center justify-center size-5 shrink-0">
          <Checkbox
            checked={isSelected}
            onClick={handleCheckboxInteraction}
            className={cn(
              "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 size-5 border-slate-400 bg-white shadow-sm transition-opacity z-20",
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 absolute"
            )}
          />
          {/* Folder Icon: */}
          <FolderIcon
            className={cn(
              "size-5 text-slate-600 fill-slate-600 transition-opacity",
              isSelected ? "opacity-0" : "group-hover:opacity-0"
            )}
          />
        </div>

        <span
          className="truncate text-sm font-medium text-slate-700 flex-1"
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
          }
        )}
      >
        {/* PREVIEW AREA */}
        <div className="aspect-[4/3] w-full bg-slate-50 flex items-center justify-center overflow-hidden relative border-b border-slate-100">
          {(item as IFile).mimeType?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(item as IFile).location}
              alt={item.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <FileIcon
              mimeType={(item as IFile).mimeType}
              className="size-16 opacity-80"
            />
          )}

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
                  "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 size-5 border-slate-400 bg-white shadow-sm transition-opacity z-20 absolute top-0 left-0",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              />
              {/* Icon */}
              <div
                className={cn(
                  "transition-opacity duration-200",
                  isSelected ? "opacity-0" : "group-hover:opacity-0"
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
    null
  );

  // [LOGIC MỚI] Xử lý click vào Card
  const handleCardClickWithEvent = (
    e: React.MouseEvent,
    item: IFolder | IFile
  ) => {
    const currentIndex = allItems.findIndex((i) => i._id === item._id);

    // 1. Nếu giữ Shift -> Thực hiện chọn nhiều (Multi-Select)
    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== -1) {
      e.preventDefault(); // Ngăn việc bôi đen text trình duyệt
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const itemsToSelect = allItems.slice(start, end + 1);
      onMultiSelect(itemsToSelect);
    }
    // 2. Nếu giữ Ctrl/Meta -> Thực hiện Toggle Select (tùy chọn thêm cho UX tốt hơn)
    else if (e.ctrlKey || e.metaKey) {
      onCheckboxClick(item);
    }
    // 3. Click bình thường -> NAVIGATE luôn (Không Select)
    else {
      onNavigate(item);
    }

    // Lưu lại index để phục vụ Shift Click lần sau
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
