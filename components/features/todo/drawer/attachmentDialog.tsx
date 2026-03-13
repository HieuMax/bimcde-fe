"use client";

import { useState } from "react";
import { X, FileIcon, Camera, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentDialogProps {
  params?: Promise<{ projectId: string }>;

  isOpen: boolean;
  onClose: () => void;
  onAddAttachments: (files: File[]) => void;
}

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
}

export default function AttachmentDialog({
  params,
  isOpen,
  onClose,
  onAddAttachments,
}: AttachmentDialogProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "camera" | "screen">(
    "browse",
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(["test"]);
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [dragActive, setDragActive] = useState(false);

  // Mock file system for browse tab
  const fileSystem: Record<string, FileItem[]> = {
    test: [
      { id: "1", name: "etes", type: "folder" },
      {
        id: "2",
        name: "819e7284-9019-40ac-9180-3cf93b2bcdd3...",
        type: "file",
      },
    ],
    "test/etes": [
      { id: "3", name: "document.pdf", type: "file" },
      { id: "4", name: "image.jpg", type: "file" },
    ],
  };

  const currentPathKey = currentPath.join("/");
  const currentItems = fileSystem[currentPathKey] || [];

  // const getAllFile = async () => {
  //   try {
  //     const projectId = (await params).projectId;

  //     const response = await get(`/team/getMemberProject/${projectId}`);
  //     if (response.success) {
  //       const updatedUsers = (response.result || []).map((user: any) => {
  //         return {
  //           ...user,
  //           subLabel: user.email,
  //           name: user.fullName,
  //           type: "user",
  //         };
  //       });

  //       setMemberData(updatedUsers);
  //     } else {
  //       console.error("Failed to fetch group:", response.error);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching group:", err);
  //   }
  // };

  const handleNavigate = (
    itemId: string,
    itemName: string,
    itemType: string,
  ) => {
    if (itemType === "folder") {
      setCurrentPath([...currentPath, itemName]);
    }
  };

  const handleBackFolder = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const newFiles = files.filter(
      (file) => !selectedFiles.find((f) => f.name === file.name),
    );
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.filter(
        (file) => !selectedFiles.find((f) => f.name === file.name),
      );
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleAddAttachments = () => {
    onAddAttachments(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 shadow-lg max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add attachments
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex items-center gap-2 px-4 py-4 font-medium transition ${
              activeTab === "browse"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            <FileIcon size={20} />
          </button>
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex items-center gap-2 px-4 py-4 font-medium transition ${
              activeTab === "camera"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            <Camera size={20} />
          </button>
          <button
            onClick={() => setActiveTab("screen")}
            className={`flex items-center gap-2 px-4 py-4 font-medium transition ${
              activeTab === "screen"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}>
            <Monitor size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-64">
          {activeTab === "browse" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You can select more than one file at a time.
              </p>

              {/* File List */}
              <div className="border border-gray-200 rounded-lg divide-y">
                {currentPath.length > 1 && (
                  <div
                    onClick={handleBackFolder}
                    className="p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                    <span className="text-blue-600">← Back</span>
                  </div>
                )}
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      handleNavigate(item.id, item.name, item.type)
                    }
                    className={`p-3 flex items-center gap-3 ${
                      item.type === "folder"
                        ? "hover:bg-gray-50 cursor-pointer"
                        : ""
                    }`}>
                    {item.type === "folder" ? (
                      <>
                        <FileIcon size={20} className="text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          {item.name}
                        </span>
                        <span className="ml-auto text-gray-400">›</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <FileIcon size={16} className="text-gray-600" />
                        <span className="text-gray-600 text-sm">
                          {item.name}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "camera" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Views</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("3D")}
                    className={`px-3 py-1 rounded transition ${
                      viewMode === "3D"
                        ? "bg-gray-300 text-gray-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    3D
                  </button>
                  <button
                    onClick={() => setViewMode("2D")}
                    className={`px-3 py-1 rounded transition ${
                      viewMode === "2D"
                        ? "bg-gray-300 text-gray-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    2D
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Camera size={48} className="mb-4" />
                <p className="text-gray-500">No results found</p>
              </div>
            </div>
          )}

          {activeTab === "screen" && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}>
                <FileIcon size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-700">
                  Drag and drop files here or{" "}
                  <label className="text-blue-600 cursor-pointer hover:underline">
                    Browse
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </p>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 overflow-auto h-full max-h-[300px]">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileIcon size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                Please note: Selecting file(s) with the same name in this
                selection will be ignored.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6 py-2">
            Cancel
          </Button>
          <Button
            onClick={handleAddAttachments}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white">
            Add attachments
          </Button>
        </div>
      </div>
    </div>
  );
}
