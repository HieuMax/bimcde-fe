"use client";

import { useState, useEffect } from "react";
import { IFile, IFolder } from "@/types/explorer"; // Adjust import path
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, FileText, ChevronLeft, Loader2, Database } from "lucide-react";
import { toast } from "sonner";
import { explorerService } from "@/services/explorer.service";

interface MiniFileExplorerProps {
  projectId: string;
  onConfirm: (files: IFile[]) => void;
  hideFooterActions?: boolean;
  onSelectionChange?: (files: IFile[]) => void;
  /** When provided, selection is controlled - checkboxes reflect these IDs and sync when they change */
  selectedFileIds?: string[];
}

export function MiniFileExplorer({
  projectId,
  onConfirm,
  hideFooterActions = false,
  onSelectionChange,
  selectedFileIds,
}: MiniFileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string | null; name: string }[]>(
    [{ id: null, name: "Root" }],
  );
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{
    folders: IFolder[];
    files: IFile[];
  }>({
    folders: [],
    files: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<IFile[]>([]);

  // Sync internal selection when controlled selection changes (e.g. removed via X in parent)
  useEffect(() => {
    if (selectedFileIds && selectedFileIds.length >= 0) {
      setSelectedFiles((prev) =>
        prev.filter((f) => selectedFileIds.includes(f._id)),
      );
    }
  }, [selectedFileIds]);

  // Fetch Data
  const fetchData = async (folderId: string | null) => {
    setLoading(true);
    try {
      const res = await explorerService.getContent(projectId, folderId);
      setContent({
        folders: res.subFolders || [],
        files: res.files || [],
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load folder content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentFolderId);
  }, [currentFolderId, projectId]);

  // Handlers
  const handleNavigate = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    setHistory((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const handleBack = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const prevFolder = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setCurrentFolderId(prevFolder.id);
  };

  const toggleSelection = (file: IFile) => {
    setSelectedFiles((prev) => {
      const exists = prev.find((f) => f._id === file._id);
      const next = exists
        ? prev.filter((f) => f._id !== file._id)
        : [...prev, file];
      onSelectionChange?.(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-[200px]">
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-2 border-b bg-slate-50">
        <Button
          variant="ghost"
          size="sm"
          disabled={history.length <= 1}
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium truncate text-slate-700">
          {history.map((h) => h.name).join(" / ")}
        </span>
      </div>

      {/* Content List */}
      <ScrollArea className="flex-1 p-2 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : content.folders.length === 0 && content.files.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-10">
            Empty folder
          </div>
        ) : (
          <div className="space-y-1">
            {/* Folders */}
            {content.folders.map((folder) => (
              <div
                key={folder._id}
                className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-slate-700"
                onClick={() => handleNavigate(folder._id, folder.name)}
              >
                <Folder className="w-4 h-4 text-blue-500 fill-blue-100" />
                <span className="text-sm truncate flex-1">{folder.name}</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-slate-300" />
              </div>
            ))}

            {/* Files */}
            {content.files.map((file) => {
              const isSelected = selectedFileIds
                ? selectedFileIds.includes(file._id)
                : selectedFiles.some((f) => f._id === file._id);
              return (
                <div
                  key={file._id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded group"
                  onClick={() => toggleSelection(file)}
                >
                  <Checkbox checked={isSelected} />
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer Actions */}
      {!hideFooterActions && (
        <div className="p-3 border-t flex justify-between items-center bg-slate-50">
          <span className="text-xs text-slate-500">
            {selectedFiles.length} file(s) selected
          </span>
          <Button
            size="sm"
            disabled={selectedFiles.length === 0}
            onClick={() => onConfirm(selectedFiles)}
          >
            Attach Selected
          </Button>
        </div>
      )}
    </div>
  );
}
