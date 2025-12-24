"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { File as FileIcon, Upload, Loader2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // Dùng ScrollArea của Shadcn cho đẹp

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
}

export default function UploadFileDialog({
  open,
  onOpenChange,
  onUpload,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Khi file được thả hoặc chọn -> Chỉ lưu vào State, KHÔNG upload ngay
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Thêm file mới vào danh sách cũ (tránh trùng lặp nếu cần, ở đây tôi cho phép trùng tên)
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  // Cấu hình Dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileBrowser,
  } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

  // 2. Hàm xóa file khỏi danh sách chờ
  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 3. Hàm xử lý nút Upload cuối cùng
  const handleUploadClick = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(files);
      setFiles([]); // Reset danh sách sau khi upload thành công
      onOpenChange(false); // Đóng modal
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm format dung lượng file cho đẹp (VD: 1.5 MB)
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
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-slate-900">
              Upload files
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              You can select more than one file at a time.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* --- BODY --- */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Vùng Dropzone (Luôn hiện để có thể kéo thêm file vào) */}
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
            // Cho phép click vào vùng này để chọn thêm file nếu muốn (UX tốt hơn)
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

          {/* Danh sách File đã chọn (Chỉ hiện khi files > 0) */}
          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Selected Files ({files.length})
              </h4>
              <ScrollArea className="h-[200px] w-full pr-4 border rounded-md border-slate-100">
                <div className="space-y-1 p-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Icon File */}
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

                      {/* Nút xóa file */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
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

        {/* --- FOOTER --- */}
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
