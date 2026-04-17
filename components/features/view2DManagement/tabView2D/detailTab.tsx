"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { explorerService } from "@/services/explorer.service";
import { IFile } from "@/types/explorer";
import {
  Pencil,
  X,
  Tag as TagIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useComments } from "../../explorer/hooks/useComments";
import CommentList from "../../explorer/properties/components/comments/CommentList";
import CommentInput from "../../explorer/properties/components/comments/CommentInput";

// Nhúng Hook useTags và Service API
import { useTags } from "@/components/features/explorer/hooks/useTags";
import { View2DItem } from "@/types/view2d";
import VersionHistoryPanel from "./VersionHistoryPanel";

type Props = {
  file: IFile | null;
  view?: View2DItem | null;
  onUpdateSuccess?: (updatedFile: IFile) => void;
  /** When set, "Open" in version history loads this revision in the main 2D viewer. */
  onOpenVersionInViewer?: (version: {
    version: number | string;
    location?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  }) => void;
  activeViewerVersion?: number | null;
};

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "--";
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDate(date?: string) {
  if (!date) return "--";
  return new Date(date).toLocaleDateString();
}

// ✅ Helper: Extract nearest folder from location path
function getNearestFolder(location?: string): { folderName: string; folderId: string; fullPath: string } | null {
  if (!location) return null;

  // Format: "project/folder1/folder2" or "project/folder1/folder2/file.ifc"
  const parts = location.split("/").filter((p) => p.trim());
  
  if (parts.length <= 1) return null; // Only project, no folder
  
  // Skip project (first part)
  const folderParts = parts.slice(1);
  
  // Check if last part is a file (has extension like .ifc, .pdf, .docx)
  const lastPart = folderParts[folderParts.length - 1];
  const hasExtension = /\.[a-z0-9]{2,5}$/i.test(lastPart);
  
  // Remove file if it has extension
  if (hasExtension) {
    folderParts.pop();
  }
  
  // If no folder parts left, return null
  if (folderParts.length === 0) return null;
  
  // Get the last (nearest) folder
  const nearestFolder = folderParts[folderParts.length - 1];
  const fullPath = folderParts.join(" > ");
  
  return { 
    folderName: nearestFolder, 
    folderId: nearestFolder, // Use folder name as ID for now, backend can map
    fullPath
  };
}

export default function FileDetailTab({
  file,
  onUpdateSuccess,
  onOpenVersionInViewer,
  activeViewerVersion,
}: Props) {
  const router = useRouter();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false); // Thêm state loading khi Save
  const [showVersionHistory, setShowVersionHistory] = useState(false); // ✅ State for History Version panel

  // State gom nhóm cho form edit
  const [editForm, setEditForm] = useState({
    name: "",
    tags: [] as string[],
  });

  const {
    comments,
    totalComments,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment,
    isAdding: isAddingComment,
    updateComment,
    deleteComment,
    currentUserId,
  } = useComments(file?._id || "", "file");

  // Fetch tags của project chứa file này
  const projectId = typeof file?.projectId === "string" 
    ? file.projectId 
    : (file?.projectId as any)?._id;
    
  const { tags: availableTags, isLoading: isTagsLoading } = useTags(
    projectId || "",
  );

  // Đồng bộ dữ liệu file vào state edit khi file thay đổi hoặc đổi mode
  useEffect(() => {
    if (file) {
      setEditForm({
        name: file.name || "",
        tags:
          file.tags?.map((t: any) => (typeof t === "string" ? t : t._id)) || [],
      });
    }
  }, [file, mode]);

  if (!file) {
    return <div className="p-4 text-sm text-gray-500">No file selected</div>;
  }

  const handleLocationClick = () => {
    // Extract projectId 
    const projectId = typeof file.projectId === "string" 
      ? file.projectId 
      : (file.projectId as any)?._id;
    
    if (!projectId) return;

    // If file has folderId → navigate to /data (folder view)
    // If no folderId → navigate to project root
    if (file.folderId) {
      router.push(`/projects/${projectId}/data`);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  const handleShowVersionHistory = () => {
    setShowVersionHistory(true);
  };

  const handleOpenVersion = (version: {
    version: number | string;
    location?: string;
    fileName?: string;
  }) => {
    setShowVersionHistory(false);

    if (!file?._id || !version?.version) return;

    if (onOpenVersionInViewer) {
      onOpenVersionInViewer(version);
      return;
    }

    void explorerService.openFileVersion(
      file._id,
      Number(version.version),
      version.location || file.fileUrl,
    );
  };


  const handleSaveDetails = async () => {
    let finalName = editForm.name.trim();

    if (!finalName) {
      alert("Title is required");
      return;
    }

    const extMatch = file.name.match(/\.[0-9a-z]+$/i);
    if (extMatch) {
      const ext = extMatch[0];
      let cleaned = finalName;

      cleaned = cleaned.replace(/[\.\s]+$/, "");

      while (cleaned.toLowerCase().endsWith(ext.toLowerCase())) {
        cleaned = cleaned.slice(0, -ext.length); 
        cleaned = cleaned.replace(/[\.\s]+$/, "");
      }

      finalName = cleaned + ext;
    }
    // --------------------------------------------

    setLoading(true);
    try {
      let userObj: any = null;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) userObj = JSON.parse(userStr);
      } catch (e) {}
      const userId = userObj?._id || userObj?.id || currentUserId || "";

      let updatedFileRes: any = { ...file };

      if (finalName !== file.name) {
        const renameResult = await explorerService.renameFile(
          file._id,
          finalName,
          userId,
        );
        if (renameResult) {
          updatedFileRes = { ...updatedFileRes, ...renameResult };
        }
      }

      const tagUpdatedFiles = await explorerService.assignTags(
        [file._id],
        editForm.tags,
      );
      if (tagUpdatedFiles && tagUpdatedFiles.length > 0) {
        const updatedWithTag = tagUpdatedFiles.find(
          (f: any) => f._id === file._id,
        );
        if (updatedWithTag) {
          updatedFileRes = { ...updatedFileRes, ...updatedWithTag };
        }
      }

      if (onUpdateSuccess) {
        updatedFileRes.tags = editForm.tags.map((tagId) => {
          const found = availableTags?.find((at: any) => at._id === tagId);
          return found || tagId;
        });

        onUpdateSuccess(updatedFileRes);
      }

      setMode("view");
    } catch (error) {
      console.error("Lỗi khi lưu thông tin file:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT MODE ================= */
  if (mode === "edit") {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setMode("view")}
          >
            <ArrowLeft size={18} /> Edit File
          </button>

          <button
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            onClick={() => setMode("view")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Name</div>
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none px-3 py-2 text-sm rounded transition-all"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* ===== CHỌN TAGS ===== */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <TagIcon size={14} /> Tags
            </label>

            <div className="p-3 border border-gray-200 rounded-md bg-gray-50 flex flex-wrap gap-2 min-h-[60px]">
              {isTagsLoading ? (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Loading tags...
                </div>
              ) : availableTags?.length === 0 ? (
                <div className="text-xs text-gray-400 italic">
                  No tags available in this project.
                </div>
              ) : (
                availableTags?.map((tag: any) => {
                  const isSelected = editForm.tags.includes(tag._id);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (isSelected) {
                          setEditForm({
                            ...editForm,
                            tags: editForm.tags.filter((t) => t !== tag._id),
                          });
                        } else {
                          setEditForm({
                            ...editForm,
                            tags: [...editForm.tags, tag._id],
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: isSelected
                          ? tag.color || "#3b82f6"
                          : "white",
                        color: isSelected ? "white" : "#4b5563",
                        borderColor: isSelected
                          ? tag.color || "#3b82f6"
                          : "#d1d5db",
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? "white"
                            : tag.color || "#000",
                        }}
                      />
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Click to select/unselect tags
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end gap-3 bg-gray-50">
          <button
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            disabled={loading}
            onClick={() => setMode("view")}
          >
            Cancel
          </button>

          <button
            className="px-5 py-1.5 text-sm font-medium bg-[#005a9e] text-white rounded hover:bg-[#004578] transition-colors flex items-center gap-2 disabled:opacity-70"
            disabled={loading}
            onClick={handleSaveDetails}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  /* ================= VIEW MODE ================= */
  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* ✅ Version History Panel Overlay */}
      {showVersionHistory && (
        <div className="absolute inset-0 z-50 bg-white rounded-lg shadow-lg border">
          <VersionHistoryPanel
            file={file}
            activeViewerVersion={activeViewerVersion}
            onClose={() => setShowVersionHistory(false)}
            onOpenVersion={handleOpenVersion}
            onDownloadVersion={(version) => {
              if (!file?._id || !version?.version) return;

              void explorerService.downloadFileVersion(
                file._id,
                Number(version.version),
                version.fileName || file.name,
              );
            }}
          />
        </div>
      )}

      {!showVersionHistory && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3 border-b">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-800 break-all pr-4">
              {file.name}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                className="p-1.5 text-gray-400 hover:text-[#005a9e] hover:bg-blue-50 rounded transition-all"
                onClick={() => setMode("edit")}
                title="Edit File Details"
              >
                <Pencil size={16} />
              </button>

              <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 text-sm space-y-4 border-b bg-slate-50">
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>

            {/* HIỂN THỊ TAGS DẠNG BADGE */}
            {file.tags && file.tags.length > 0 && (
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-tight mb-1">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {file.tags.map((t: any) => {
                    const tagId = typeof t === "string" ? t : t._id;
                    const foundTag = availableTags?.find(
                      (at: any) => at._id === tagId,
                    );
                    const tagName =
                      foundTag?.name ||
                      (typeof t === "string" ? t : t.name) ||
                      "Unknown Tag";
                    const tagColor = foundTag?.color || "#9ca3af";

                    return (
                      <span
                        key={tagId}
                        className="px-2 py-0.5 text-[10px] font-semibold rounded text-white shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: tagColor }}
                      >
                        <TagIcon size={10} />
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <DetailRow
              label="Version"
              value={file.currentVersion ? `v${file.currentVersion}` : "--"}
              actionLabel="See history"
              onActionClick={handleShowVersionHistory}
            />

            <DetailRow label="Size" value={formatFileSize(file.size)} />

            <DetailRow
              label="Location"
              value={
                getNearestFolder(file.location)?.fullPath ||
                file.projectName || 
                "Project Root" 
              }
              valueClass="text-blue-600 font-medium cursor-pointer hover:underline"
              onValueClick={handleLocationClick}
            />

            <DetailRow
              label="Created"
              value={
                file.createdAt
                  ? `${formatDate(file.createdAt)} by ${
                      typeof file.createdBy === "string"
                        ? file.createdBy
                        : (file.createdBy ?? "Unknown")
                    }`
                  : "--"
              }
            />

            <DetailRow
              label="Modified"
              value={
                file.updatedAt
                  ? `${formatDate(file.updatedAt)} by ${
                      typeof file.modifiedBy === "string"
                        ? file.modifiedBy
                        : (file.modifiedBy ?? "Unknown")
                    }`
                  : "--"
              }
            />
          </div>

          {/* ===== COMMENTS ===== */}
          <div className="flex-1 flex flex-col relative min-h-0 bg-white">
            {/* Danh sách Comment */}
            <div className="flex-1 overflow-y-auto pb-16 custom-scrollbar">
              <CommentList
                comments={comments}
                totalComments={totalComments}
                isLoading={isCommentsLoading}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                currentUserId={currentUserId}
                onUpdate={updateComment}
                onDelete={deleteComment}
              />
            </div>

            {/* Khung nhập Comment cố định dưới đáy */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 shrink-0">
              <CommentInput
                value={commentInput}
                onChange={setCommentInput}
                onSend={addComment}
                isSending={isAddingComment}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= SUB ================= */

function DetailRow({
  label,
  value,
  actionLabel,
  valueClass,
  onValueClick,
  onActionClick,
}: {
  label: string;
  value?: string;
  actionLabel?: string;
  valueClass?: string;
  onValueClick?: () => void;
  onActionClick?: () => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-tight mb-0.5">
        {label}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div
          className={`text-sm text-gray-700 font-medium ${valueClass || ""}`}
          onClick={onValueClick}
        >
          {value || "--"}
        </div>

        {actionLabel && (
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={onActionClick}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
