"use client";

import React, { useState } from "react";
import { IReleaseItem } from "@/types/release";
import { Button } from "@/components/ui/button";
import { X, FileText, Download, Eye, Tag, Trash2, Key } from "lucide-react";
import { ItemPermissionsDialog } from "@/components/features/explorer/dialogs/ItemPermissionsDialog";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { filesize } from "filesize";
import { useRouter } from "next/navigation";

interface FilePropertiesPanelProps {
  item: IReleaseItem | null;
  projectId: string;
  onClose: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

export const FilePropertiesPanel: React.FC<FilePropertiesPanelProps> = ({
  item,
  projectId,
  onClose,
  onDownload,
  onDelete,
}) => {
  const router = useRouter();
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  if (!item) return null;
  const handleViewFile = () => {
    if (!item?.name) return;

    const fileExt = item.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return;

    const IFC_FILES = ["ifc"];
    const DOC_FILES = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"];

    // IFC → 3D Viewer
    if (IFC_FILES.includes(fileExt)) {
      if (!item.location) return;

      // Normalize in case location is already URL-encoded
      let locationUrl = item.location;
      try {
        const decoded = decodeURIComponent(item.location);
        if (/^https?:\/\//i.test(decoded)) {
          locationUrl = decoded;
        }
      } catch {
        // ignore malformed encoding and keep original
      }

      router.push(
        `/projects/${projectId}/viewer3d?urls=${encodeURIComponent(
          JSON.stringify([locationUrl]),
        )}`,
      );
      return;
    }

    // Document / Image → Project Viewer
    if (DOC_FILES.includes(fileExt)) {
      router.push(`/projects/${projectId}/viewer/${item.fileId}`);
      return;
    }

    // Fallback (nếu cần)
    router.push(`/projects/${projectId}/viewer/${item.fileId}`);
  };
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 min-h-[70px] shrink-0">
        <h2 className="text-base font-medium text-gray-900 leading-tight truncate pr-2">
          {item.name}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-6">
          {/* THUMBNAIL SECTION */}
          <div className="flex items-center justify-center h-[150px] bg-slate-50">
            <div className="h-20 w-20 bg-white rounded shadow-sm flex items-center justify-center">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <Separator />

          {/* TOOLBAR SECTION */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="mr-auto">
              <Button
                className="bg-slate-800 hover:bg-slate-700 text-white h-9 px-4 text-sm font-medium"
                onClick={handleViewFile}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:bg-gray-100 h-9 w-9"
                onClick={() => setPermissionsOpen(true)}
                title="Permissions"
              >
                <Key size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:bg-gray-100 h-9 w-9"
                onClick={onDownload}
                title="Download"
              >
                <Download size={18} />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 h-9 w-9"
                  onClick={onDelete}
                  title="Remove from release"
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* INFO SECTION */}
          <div className="p-4 space-y-5">
            <h3 className="text-base font-medium text-gray-900">Details</h3>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Version</p>
                <div className="text-foreground font-normal">
                  {item.version}
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Type</p>
                <div
                  className="text-foreground font-normal truncate"
                  title={item.mimeType}
                >
                  {item.mimeType || "Unknown"}
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Size</p>
                <div className="text-foreground font-normal">
                  {filesize(item.size || 0) as string}
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Modified</p>
                <div className="text-foreground font-normal">
                  {item.updatedAt
                    ? format(new Date(item.updatedAt), "MMM dd, yyyy HH:mm")
                    : "-"}{" "}
                  by {item.modifiedBy}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* TAGS SECTION */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.tags && item.tags.length > 0 ? (
                item.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No tags</span>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <ItemPermissionsDialog
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
        mode="file"
        projectId={projectId}
        itemId={item.fileId}
        itemName={item.name}
      />
    </div>
  );
};
