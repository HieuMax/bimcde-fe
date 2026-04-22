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
import { useRouter, useParams } from "next/navigation";
import {
  resolveExplorerFileThumbnailSrc,
  shellFileThumbnailKey,
  isLikelyRasterImageUrl,
} from "@/lib/explorer/fileThumbnail";
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
  const itemBlocked = (item as any).cdeAccessible === false;
  const isFileLocked = !isFolder && (item as IFile).isLocked;

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;

  const handleViewFile = (item: IFile | IFolder) => {
    const isFile = "mimeType" in item;

    if (!isFile) {
      if ("totalSize" in item && (item as IFolder).cdeAccessible === false) {
        return;
      }
      router.push(`/projects/${projectId}/data?folderId=${item._id}`);
      return;
    }

    const fileExt = item.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return;

    const IFC_FILES = ["ifc"];
    const DOC_FILES = ["docs", "pdf", "png", "jpg", "webp"];

    // IFC → 3D Viewer
    if (IFC_FILES.includes(fileExt)) {
      router.push(
        `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(JSON.stringify([item.location]))}`,
      );
      return;
    }

    // DOC / PDF → Project Viewer
    if (DOC_FILES.includes(fileExt)) {
      router.push(`/projects/${projectId}/viewer/${item._id}`);
      return;
    }
  };

  const handleRowInteraction = (e: React.MouseEvent) => {
    if (itemBlocked) return;

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
    handleViewFile(item);
  };

  const handleCheckboxInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemBlocked) return;
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

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
  };

  // Helper formats
  const formattedDate = item.updatedAt
    ? format(new Date(item.updatedAt), "MMM dd, yyyy")
    : "Unknown";

  const formattedSize = filesize(
    (isFolder ? (item as IFolder).totalSize : (item as IFile).size) ?? 0,
  ) as string;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group select-none transition-colors border-gray-50 text-base ${itemBlocked
          ? "cursor-not-allowed bg-slate-50 text-slate-500 hover:bg-slate-100/90"
          : "cursor-pointer"
        } ${!itemBlocked && isSelected
          ? "bg-blue-50 hover:bg-blue-100"
          : !itemBlocked
            ? "hover:bg-gray-50"
            : ""
        } ${isOver && !itemBlocked ? "bg-blue-100 ring-2 ring-blue-400 z-10" : ""}`}
      onClick={handleRowInteraction}
    >
      {/* ICON & CHECKBOX CELL */}
      <TableCell className="py-2 md:py-4 relative w-14 md:w-20 text-center p-0">
        <div className="flex items-center justify-center w-full h-full relative">
          {!itemBlocked && (
            <div
              className={`
              absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-200
              ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }
            `}
            >
              <Checkbox
                checked={isSelected}
                onClick={handleCheckboxInteraction}
                className="size-4 md:size-5"
              />
            </div>
          )}

          <div
            className={`
              transition-opacity duration-200
              ${isSelected ? "opacity-0" : "opacity-100 group-hover:opacity-0"}
            `}
          >
            {isFolder ? (
              <Folder
                className={`size-8 md:size-10 ${itemBlocked
                    ? "text-slate-400 fill-slate-300"
                    : "text-black fill-black"
                  }`}
              />
            ) : (
              (() => {
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
                      alt=""
                      className="size-8 md:size-10 rounded object-cover border border-slate-200"
                    />
                  );
                }
                return (
                  <FileIcon
                    mimeType={f.mimeType}
                    className="size-8 md:size-10"
                  />
                );
              })()
            )}
          </div>
          {itemBlocked && !isSelected && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="rounded-full bg-white/95 p-1.5 shadow-sm border border-slate-200">
                <LockKeyhole className="size-4 text-slate-600" />
              </span>
            </div>
          )}
        </div>
      </TableCell>

      {/* NAME CELL */}
      <TableCell className="font-medium pl-2 md:pl-4">
        <div className="flex flex-col gap-0.5 justify-center">
          <span
            onClick={itemBlocked ? undefined : handleNameClick}
            className={`flex items-center w-fit font-normal gap-2 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] ${itemBlocked
                ? "cursor-not-allowed text-slate-500"
                : "cursor-pointer text-slate-700 hover:text-blue-600 hover:underline"
              }`}
          >
            {isFileLocked && (
              <LockKeyhole className="size-3 text-orange-500 shrink-0" />
            )}
            <span className="truncate text-sm md:text-base">{item.name}</span>
          </span>

          {/* MOBILE ONLY */}
          <div className="flex items-center gap-2 text-xs text-slate-400 md:hidden font-normal">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{formattedSize}</span>
          </div>
        </div>
      </TableCell>

      {/* MODIFIED BY CELL*/}
      <TableCell className="text-slate-500 hidden lg:table-cell">
        {isFolder
          ? (item as IFolder).createdBy || "Unknown"
          : (item as IFile).modifiedBy || "Unknown"}
      </TableCell>

      {/* DATE CELL */}
      <TableCell className="text-slate-500 hidden md:table-cell whitespace-nowrap">
        {formattedDate}
      </TableCell>

      {/* SIZE CELL */}
      <TableCell className="text-slate-500 hidden md:table-cell whitespace-nowrap">
        {formattedSize}
      </TableCell>

      {/* TAGS CELL */}
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
                        <div className="flex gap-1">
                          {hiddenTags.map((tag) => tag.name).join(", ")}
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
    null,
  );

  const isBlockedItem = (i: IFolder | IFile) => (i as any).cdeAccessible === false;

  const handleRowClickWithEvent = (
    e: React.MouseEvent,
    item: IFolder | IFile,
  ) => {
    if (isBlockedItem(item)) return;

    const currentIndex = allItems.findIndex((i) => i._id === item._id);

    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== -1) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const itemsToSelect = allItems
        .slice(start, end + 1)
        .filter((i) => !isBlockedItem(i));
      onMultiSelect(itemsToSelect);
    } else {
      onRowClick(item);
    }
    setLastSelectedIndex(currentIndex);
  };

  if (!allItems.length)
    return <div className="p-10 text-center text-slate-400">Empty folder</div>;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full relative">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-slate-200">
            {/* 1. Header ICON: Width responsive */}
            <TableHead className="w-14 md:w-20"></TableHead>

            {/* 2. Header NAME */}
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

            {/* 3. Header MODIFIED BY */}
            <TableHead className="hidden lg:table-cell whitespace-nowrap">
              Modified by
            </TableHead>

            {/* 4. Header MODIFIED ON */}
            <TableHead className="hidden md:table-cell whitespace-nowrap">
              Modified on
            </TableHead>

            {/* 5. Header SIZE */}
            <TableHead className="md:w-22 lg:w-48 hidden md:table-cell whitespace-nowrap">
              Size
            </TableHead>

            {/* 6. Header TAGS */}
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
