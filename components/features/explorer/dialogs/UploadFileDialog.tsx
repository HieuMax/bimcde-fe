"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File as FileIcon, Upload, Loader2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  EXPLORER_UPLOAD_ACCEPT,
  MAX_FILES_PER_UPLOAD,
  MAX_UPLOAD_BYTES,
  prepareExplorerUploadFile,
  validateExplorerFileClient,
} from "@/lib/explorer/uploadConstraints";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (
    files: File[],
    onProgress?: (percent: number) => void,
  ) => Promise<void>;
}

function rejectionMessage(rejections: FileRejection[]): string {
  return rejections
    .map((r) => {
      const parts = r.errors.map((e) => e.message).join(", ");
      return `${r.file.name}: ${parts}`;
    })
    .join("\n");
}

export default function UploadFileDialog({
  open,
  onOpenChange,
  onUpload,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const next: File[] = [];
    for (const f of acceptedFiles) {
      const err = validateExplorerFileClient(f);
      if (err) {
        toast.error(err.message, { description: err.fileName });
        continue;
      }
      next.push(prepareExplorerUploadFile(f));
    }
    if (!next.length) return;
    setFiles((prev) => {
      const room = MAX_FILES_PER_UPLOAD - prev.length;
      if (room <= 0) {
        toast.error(
          `You can upload at most ${MAX_FILES_PER_UPLOAD} files at once.`,
        );
        return prev;
      }
      const toAdd = next.slice(0, room);
      if (next.length > room) {
        toast.warning(
          `Only ${room} more file(s) added (maximum ${MAX_FILES_PER_UPLOAD} per upload).`,
        );
      }
      return [...prev, ...toAdd];
    });
  }, []);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    toast.error("Some files were rejected", {
      description: rejectionMessage(rejections),
    });
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileBrowser,
  } = useDropzone({
    onDrop,
    onDropRejected,
    noClick: true,
    noKeyboard: true,
    multiple: true,
    maxSize: MAX_UPLOAD_BYTES,
    accept: EXPLORER_UPLOAD_ACCEPT,
    validator: (file) => {
      const err = validateExplorerFileClient(file);
      if (err) {
        return { message: err.message, code: "explorer-rules" };
      }
      return null;
    },
  });

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUploadClick = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadPercent(0);
    try {
      await onUpload(files, setUploadPercent);
      setFiles([]);
      setUploadPercent(0);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 bg-white overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-slate-900">
              Upload files
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-left">
              You can select more than one file at a time.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div
            {...getRootProps()}
            className={`
              border border-dashed rounded-md h-32 w-full flex flex-col items-center justify-center 
              bg-slate-50 transition-colors cursor-pointer
              ${
                isDragActive
                  ? "bg-blue-50 border-blue-400"
                  : "border-slate-300 hover:bg-slate-100"
              }
            `}
            onClick={openFileBrowser}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-500">
                {isDragActive
                  ? "Drop files here..."
                  : "Drag files here or click to browse"}
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Uploading…</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#406D87] transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Selected Files ({files.length})
              </h4>
              <ScrollArea className="h-[200px] w-full pr-4 border rounded-md border-slate-100">
                <div className="space-y-1 p-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                          <FileIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-slate-700 font-medium truncate max-w-[250px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="text-slate-500"
          >
            Cancel
          </Button>

          <Button
            onClick={handleUploadClick}
            disabled={files.length === 0 || isUploading}
            className="bg-gray-500 hover:bg-[#585e6b] text-white min-w-[100px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length > 0 ? `(${files.length})` : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
