"use client";

import { useRef, useState } from "react";
import { IFile, IFolder } from "@/types/explorer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, Folder, LockKeyhole } from "lucide-react";
import { format } from "date-fns";
import { filesize } from "filesize";
import FileIcon from "./FileIcon";

import { useDraggable, useDroppable } from "@dnd-kit/core";

export type SortConfig = {
  key: "name" | "date" | "size";
  direction: "asc" | "desc";
};

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

// --- COMPONENT CON: DRAGGABLE ROW ---
function DraggableRow({
  item,
  isSelected,
  onRowClickWithEvent,
  onCheckboxClick,
  onNavigate,
}: {
  item: IFile | IFolder;
  isSelected: boolean;
  onRowClickWithEvent: (e: React.MouseEvent, item: IFolder | IFile) => void;
  onCheckboxClick: (item: IFolder | IFile) => void;
  onNavigate: (item: IFolder | IFile) => void;
}) {
  const isFolder = "totalSize" in item;
  const isFileLocked = !isFolder && (item as IFile).isLocked;

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRowInteraction = (e: React.MouseEvent) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onNavigate(item);
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      onRowClickWithEvent(e, item);
      clickTimeoutRef.current = null;
    }, 250);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(item);
  };

  const handleCheckboxInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onCheckboxClick(item);
  };

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

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
  };

  // Helper formats
  const formattedDate = item.updatedAt
    ? format(new Date(item.updatedAt), "MMM dd, yyyy")
    : "Unknown";

  const formattedSize = filesize(
    (isFolder ? (item as IFolder).totalSize : (item as IFile).size) ?? 0
  ) as string;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-pointer select-none transition-colors border-gray-50 text-base ${
        isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
      } ${isOver ? "bg-blue-100 ring-2 ring-blue-400 z-10" : ""}`}
      onClick={handleRowInteraction}
    >
      {/* 1. CỘT ICON & CHECKBOX: Responsive width (nhỏ trên mobile, to trên desktop) */}
      <TableCell className="py-2 md:py-4 relative w-14 md:w-20 text-center p-0">
        <div className="flex items-center justify-center w-full h-full relative">
          <div
            className={`
              absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-200
              ${
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }
            `}
          >
            <Checkbox
              checked={isSelected}
              onClick={handleCheckboxInteraction}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 size-5 md:size-6 border-slate-400 bg-white"
            />
          </div>

          <div
            className={`
              transition-opacity duration-200
              ${isSelected ? "opacity-0" : "opacity-100 group-hover:opacity-0"}
            `}
          >
            {isFolder ? (
              <Folder className="size-8 md:size-10 text-black fill-black" />
            ) : (
              <FileIcon
                mimeType={(item as IFile).mimeType}
                className="size-8 md:size-10"
              />
            )}
          </div>
        </div>
      </TableCell>

      {/* 2. CỘT TÊN: Hiển thị đầy đủ thông tin phụ trên Mobile */}
      <TableCell className="font-medium pl-2 md:pl-4">
        <div className="flex flex-col gap-0.5 justify-center">
          <span
            onClick={handleNameClick}
            className="cursor-pointer flex items-center w-fit text-slate-700 font-normal hover:text-blue-600 hover:underline gap-2 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
          >
            {isFileLocked && (
              <LockKeyhole className="size-3 text-orange-500 shrink-0" />
            )}
            <span className="truncate text-sm md:text-base">{item.name}</span>
          </span>

          {/* MOBILE ONLY: Hiển thị ngày và size ngay dưới tên (chỉ hiện trên màn hình nhỏ < md) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 md:hidden font-normal">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{formattedSize}</span>
          </div>
        </div>
      </TableCell>

      {/* 3. CỘT MODIFIED BY: Ẩn trên Mobile và Tablet, chỉ hiện trên Desktop lớn (lg) */}
      <TableCell className="text-slate-500 hidden lg:table-cell">
        {isFolder
          ? (item as IFolder).createdBy || "Unknown"
          : (item as IFile).modifiedBy || "Unknown"}
      </TableCell>

      {/* 4. CỘT DATE: Ẩn trên Mobile, hiện trên Tablet (md) trở lên */}
      <TableCell className="text-slate-500 hidden md:table-cell whitespace-nowrap">
        {formattedDate}
      </TableCell>

      {/* 5. CỘT SIZE: Ẩn trên Mobile, hiện trên Tablet (md) trở lên */}
      <TableCell className="text-slate-500 hidden md:table-cell whitespace-nowrap">
        {formattedSize}
      </TableCell>

      {/* 6. CỘT TAGS: Ẩn trên Mobile/Tablet nhỏ, chỉ hiện trên Desktop lớn (xl) */}
      <TableCell className="hidden xl:table-cell">
        {"tags" in item &&
          (
            item as IFile & {
              tags?: Array<{ _id: string; name: string; color?: string }>;
            }
          ).tags &&
          (
            item as IFile & {
              tags?: Array<{ _id: string; name: string; color?: string }>;
            }
          ).tags!.length > 0 &&
          (() => {
            const tags = (
              item as IFile & {
                tags?: Array<{ _id: string; name: string; color?: string }>;
              }
            ).tags!;
            const visibleTags = tags.slice(0, 2);
            const hiddenTags = tags.slice(2);

            return (
              <div className="flex flex-wrap gap-1">
                {visibleTags.map((tag) => (
                  <span
                    key={tag._id}
                    className="px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
                    style={{ backgroundColor: tag.color || "#64748b" }}
                  >
                    {tag.name}
                  </span>
                ))}
                {hiddenTags.length > 0 && (
                  <div className="relative">
                    <span className="peer px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600 cursor-default">
                      +{hiddenTags.length}
                    </span>
                    <div className="absolute right-0 top-full mt-1 z-50 hidden peer-hover:block">
                      <div className="bg-slate-800 text-white text-xs rounded shadow-lg px-2 py-1 max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {hiddenTags.map((tag) => (
                            <span key={tag._id} className="whitespace-nowrap">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </TableCell>
    </TableRow>
  );
}

// --- MAIN COMPONENT ---
export default function ViewList({
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

  const handleRowClickWithEvent = (
    e: React.MouseEvent,
    item: IFolder | IFile
  ) => {
    const currentIndex = allItems.findIndex((i) => i._id === item._id);

    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== -1) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const itemsToSelect = allItems.slice(start, end + 1);
      onMultiSelect(itemsToSelect);
    } else {
      onRowClick(item);
    }
    setLastSelectedIndex(currentIndex);
  };

  if (!allItems.length)
    return <div className="p-10 text-center text-slate-400">Empty folder</div>;

  return (
    // Wrapper div để xử lý overflow nếu cần thiết
    <div className="w-full overflow-x-auto">
      <Table className="w-full relative">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-slate-200">
            {/* 1. Header ICON: Width responsive */}
            <TableHead className="w-14 md:w-20"></TableHead>

            {/* 2. Header NAME: Luôn hiện */}
            <TableHead
              className="cursor-pointer hover:bg-slate-50 transition-colors select-none group pl-2 md:pl-4"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-1">
                Name
                {sortConfig.key === "name" && (
                  <span className="text-slate-500">
                    {sortConfig.direction === "asc" ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )}
                  </span>
                )}
              </div>
            </TableHead>

            {/* 3. Header MODIFIED BY: Ẩn < lg */}
            <TableHead className="hidden lg:table-cell whitespace-nowrap">
              Modified by
            </TableHead>

            {/* 4. Header MODIFIED ON: Ẩn < md */}
            <TableHead className="hidden md:table-cell whitespace-nowrap">
              Modified on
            </TableHead>

            {/* 5. Header SIZE: Ẩn < md */}
            <TableHead className="w-24 hidden md:table-cell whitespace-nowrap">
              Size
            </TableHead>

            {/* 6. Header TAGS: Ẩn < xl */}
            <TableHead className="w-40 hidden xl:table-cell whitespace-nowrap">
              Tags
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((item) => (
            <DraggableRow
              key={item._id}
              item={item}
              isSelected={selectedIds.includes(item._id)}
              onRowClickWithEvent={handleRowClickWithEvent}
              onCheckboxClick={onCheckboxClick}
              onNavigate={onNavigate}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
