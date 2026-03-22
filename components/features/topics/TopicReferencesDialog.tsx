"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { explorerService } from "@/services/explorer.service";
import { MiniFileExplorer } from "@/components/todos/MiniFileExplorer";
import { IFile } from "@/types/explorer";
import { Topic } from "./topic-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string;
  onAdd: (attachments: NonNullable<Topic["attachments"]>) => void;
};

export function TopicReferencesDialog({
  open,
  onOpenChange,
  projectId,
  userId,
  onAdd,
}: Props) {
  const [activeTab, setActiveTab] = useState("project");
  const [uploading, setUploading] = useState(false);

  // Pending only (not saved until "Add References")
  const [projectPending, setProjectPending] = useState<
    NonNullable<Topic["attachments"]>
  >([]);
  const [localPending, setLocalPending] = useState<
    NonNullable<Topic["attachments"]>
  >([]);

  const projectSelectedIds = useMemo(
    () =>
      projectPending
        .map((a) => a.fileId)
        .filter((id): id is string => Boolean(id)),
    [projectPending],
  );

  const dedupedPending = useMemo(() => {
    const seen = new Set<string>();
    const out: NonNullable<Topic["attachments"]> = [];
    for (const a of [...projectPending, ...localPending]) {
      const key = a.url || a.fileId || a.name;
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
    return out;
  }, [projectPending, localPending]);

  useEffect(() => {
    if (!open) {
      setActiveTab("project");
      setUploading(false);
      setProjectPending([]);
      setLocalPending([]);
    }
  }, [open]);

  const handleCancel = () => {
    setProjectPending([]);
    setLocalPending([]);
    onOpenChange(false);
  };

  const handleAdd = () => {
    if (dedupedPending.length === 0) return;
    onAdd(dedupedPending);
    setProjectPending([]);
    setLocalPending([]);
    onOpenChange(false);
  };

  const handleRemoveFromSelection = (
    att: NonNullable<Topic["attachments"]>[number],
  ) => {
    const key = att.url || att.fileId || att.name;
    if (!key) return;
    setProjectPending((prev) =>
      prev.filter((a) => (a.url || a.fileId || a.name) !== key),
    );
    setLocalPending((prev) =>
      prev.filter((a) => (a.url || a.fileId || a.name) !== key),
    );
  };

  const handleProjectSelectionChange = (files: IFile[]) => {
    const attachments: NonNullable<Topic["attachments"]> = files.map(
      (f: any) => ({
        name: f.name,
        fileId: f._id,
        url: f.location,
        mimeType: f.mimeType,
        size: f.size,
      }),
    );
    setProjectPending(attachments);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        const res: any = await explorerService.uploadFiles({
          files: acceptedFiles,
          projectId,
          folderId: null,
          userId,
        });

        const uploadedFiles = Array.isArray(res) ? res : [res];
        const attachments: NonNullable<Topic["attachments"]> =
          uploadedFiles.map((f: any) => {
            const versionData =
              f.versions && f.versions.length > 0 ? f.versions[0] : {};
            return {
              name: f.name,
              fileId: f._id,
              url: versionData.location || f.location || "",
              mimeType:
                versionData.mimeType ||
                f.mimeType ||
                "application/octet-stream",
              size: versionData.size || f.size || 0,
            };
          });

        setLocalPending((prev) => [...prev, ...attachments]);
        toast.success("Uploaded. Click Add References to attach.");
      } catch (error) {
        console.error(error);
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [projectId, userId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setProjectPending([]);
          setLocalPending([]);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 overflow-hidden bg-white flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Attach Files</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="project"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0 w-full"
        >
          <div className="px-6 pt-2 flex-shrink-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="project">From Project</TabsTrigger>
              <TabsTrigger value="local">Upload from Device</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="project"
            forceMount
            className="m-0 border-t mt-2 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
          >
            <div className="h-[280px] overflow-hidden">
              <MiniFileExplorer
                projectId={projectId}
                onConfirm={() => {}}
                hideFooterActions
                onSelectionChange={handleProjectSelectionChange}
                selectedFileIds={projectSelectedIds}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="local"
            forceMount
            className="m-0 border-t mt-2 p-6 min-h-[280px] data-[state=inactive]:hidden"
          >
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg h-64 w-full flex flex-col items-center justify-center 
                transition-colors cursor-pointer
                ${
                  isDragActive
                    ? "bg-blue-50 border-blue-400"
                    : "bg-slate-50 border-slate-300 hover:bg-slate-100"
                }
              `}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-sm text-slate-500">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs">SVG, PNG, JPG, PDF, IFC...</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Unified selected files list - above footer */}
        {dedupedPending.length > 0 && (
          <div className="border-t px-6 py-3 flex-shrink-0">
            <div className="text-xs text-slate-500 mb-2 font-medium">
              Selected files:
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {dedupedPending.map((a, idx) => (
                <div
                  key={a.url || a.fileId || a.name || idx}
                  className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border rounded px-2 py-1.5 min-w-0 group"
                >
                  <span className="truncate flex-1" title={a.name}>
                    {a.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromSelection(a)}
                    className="shrink-0 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Remove from selection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {dedupedPending.length > 0
                ? `${dedupedPending.length} file(s) selected`
                : "No files selected"}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={dedupedPending.length === 0 || uploading}
                className="bg-[#005F9E] hover:bg-[#004B7D] text-white"
              >
                Add References
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
