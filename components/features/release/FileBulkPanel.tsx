import React from "react";
import { IReleaseItem } from "@/types/release";
import { Button } from "@/components/ui/button";
import { X, Trash2, FileText, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileBulkPanelProps {
  selectedItems: IReleaseItem[];
  releaseStatus: string;
  /** When false, remove is disabled even in draft (e.g. not creator / not project admin). */
  canMutateFiles?: boolean;
  onClose: () => void;
  onDeselect: (fileId: string) => void;
  onDownload: () => void;
  onRemove: () => void;
}

export const FileBulkPanel: React.FC<FileBulkPanelProps> = ({
  selectedItems,
  releaseStatus,
  canMutateFiles = true,
  onClose,
  onDeselect,
  onDownload,
  onRemove,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          {selectedItems.length} SELECTED ITEMS
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5 text-slate-400" />
        </Button>
      </div>

      {/* Actions */}
      <div className="p-4 border-b space-y-2">
         <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100 font-medium"
          onClick={onDownload}
        >
          <Download className="h-5 w-5" />
          Download
        </Button>
         <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRemove}
          disabled={releaseStatus !== "DRAFT" || !canMutateFiles}
          title={
            releaseStatus !== "DRAFT"
              ? "Cannot remove files from a published release"
              : !canMutateFiles
                ? "Only the creator or a project administrator can change this release"
                : "Remove from release"
          }
        >
          <Trash2 className="h-5 w-5" />
          Remove File(s)
        </Button>
      </div>

      {/* List */}
      <div className="p-4 pb-2">
        <h3 className="text-sm font-medium text-slate-900 mb-2">Selected Files</h3>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {selectedItems.map((item) => (
            <div
              key={item.fileId}
              className="flex items-center justify-between group py-2 hover:bg-slate-50 rounded px-1 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-sm text-slate-700 truncate">{item.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                onClick={() => onDeselect(item.fileId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
