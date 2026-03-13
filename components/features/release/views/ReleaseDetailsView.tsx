"use client";

import { useState } from "react";
import { IRelease } from "@/types/release";
import { Button } from "@/components/ui/button";
import {
  X,
  Pencil,
  Download,
  Trash2,
  MoreVertical,
  Activity,
  Send,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ReleaseStatusBadge } from "../ReleaseStatusBadge";
import { useComments } from "@/components/features/explorer/hooks/useComments";
import CommentList from "@/components/features/explorer/properties/components/comments/CommentList";
import CommentInput from "@/components/features/explorer/properties/components/comments/CommentInput";
import { releaseService } from "@/services/release.service";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/app/context/authContext";

interface Props {
  release: IRelease;
  onClose: () => void;
  onEdit: () => void;
  onUpdate: () => void; // Refresh list parent
}

export default function ReleaseDetailsView({
  release,
  onClose,
  onEdit,
  onUpdate,
}: Props) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook Comments (Giữ nguyên logic của bạn)
  const {
    comments,
    totalComments,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment,
    isAdding,
    updateComment,
    deleteComment,
    currentUserId,
  } = useComments(release._id, "release");

  // --- LOGIC HELPER ---
  const isDraft = release.status === "DRAFT";

  // Permission Check
  const canModify =
    user?.role === "admin" || user?._id === release.createdBy._id;

  // Logic kiểm tra xem có thể gửi hay không (Phải có ít nhất 1 recipient)
  const hasRecipients = release.recipients && release.recipients.length > 0;
  const canSend = isDraft && hasRecipients && canModify;

  // --- ACTIONS ---
  const handleSend = async () => {
    if (!hasRecipients) {
      toast.error("Please add recipients before sending.");
      return;
    }
    try {
      setIsProcessing(true);
      await releaseService.sendRelease(release._id);
      toast.success("Release sent successfully");
      onUpdate(); // Refresh để cập nhật trạng thái sang SENT
    } catch (error) {
      console.error(error);
      toast.error("Failed to send release");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast.info("Preparing download...");
      // Logic gọi API download (BE trả về stream hoặc url)
      await releaseService.downloadRelease(release._id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download release");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this release? This action cannot be undone."
      )
    )
      return;
    try {
      setIsProcessing(true);
      await releaseService.deleteRelease(release._id);
      toast.success("Release deleted successfully");
      onClose(); // Đóng panel
      onUpdate(); // Refresh danh sách bên ngoài
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete release");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCreatorName = () => {
    if (typeof release.createdBy === "object" && release.createdBy !== null) {
      return (release.createdBy as any).fullName || "Unknown";
    }
    return "Unknown User";
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 min-h-[60px] shrink-0">
        <h2
          className="text-lg font-semibold text-gray-800 leading-tight truncate pr-2"
          title={release.name}
        >
          {release.name}
        </h2>
        <div className="flex items-center gap-1">
          {isDraft && canModify && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900"
              onClick={onEdit}
              title="Edit Release"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-500 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        {/* Chỉ hiện nút Send khi là Draft */}
        {isDraft && canModify && (
          <Button
            onClick={handleSend}
            disabled={isProcessing || !canSend}
            className={`h-9 px-4 rounded-sm font-medium transition-colors ${
              !canSend
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#5b636a] hover:bg-[#4a5157] text-white"
            }`}
            title={!canSend ? "Add recipients to send" : "Send Release"}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        )}

        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-sm"
            title="Download Zip"
          >
            <Download className="h-5 w-5" />
          </Button>

          {canModify && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isProcessing}
              className="h-9 w-9 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-sm"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-sm"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => toast.info("See activity clicked")}
              >
                <Activity className="mr-2 h-4 w-4" />
                See activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. INFO SECTION */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-6">
          <div className="p-4 space-y-5">
            {/* Status Info */}
            <div>
              <h4 className="text-xs font-normal text-gray-500 mb-1">Status</h4>
              <ReleaseStatusBadge status={release.status} />
            </div>

            {/* Due Date - Đã fix hiển thị */}
            <div>
              <h4 className="text-xs font-normal text-gray-500 mb-1">
                Due date
              </h4>
              <p className="text-sm text-gray-900 font-medium flex items-center">
                {release.dueDate ? (
                  <>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    {format(new Date(release.dueDate), "MMM dd, yyyy")}
                  </>
                ) : (
                  <span className="text-gray-400 italic">--</span>
                )}
              </p>
            </div>

            {/* Recipients */}
            <div>
              <h4 className="text-xs font-normal text-gray-500 mb-1">
                Recipients
              </h4>
              <div className="text-sm text-gray-900">
                {release.recipients && release.recipients.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {release.recipients.map((r, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 px-2 py-0.5 rounded text-xs"
                      >
                        {r.fullName || "User"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-red-500 italic text-xs">
                    No recipients added
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-xs font-normal text-gray-500 mb-1">Notes</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2 rounded-sm border border-gray-100">
                {release.description || (
                  <span className="text-gray-400 italic">No notes</span>
                )}
              </p>
            </div>

            {/* Created By */}
            <div>
              <h4 className="text-xs font-normal text-gray-500 mb-1">
                Created
              </h4>
              <p className="text-sm text-gray-900">
                {format(new Date(release.createdAt), "MMM dd, yyyy")} By{" "}
                <span className="font-medium">{getCreatorName()}</span>
              </p>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Comments Section */}
          <div className="px-2">
            <CommentList
              comments={comments}
              totalComments={totalComments}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              currentUserId={currentUserId}
              onUpdate={updateComment}
              onDelete={deleteComment}
            />
          </div>
        </div>
      </ScrollArea>

      {/* 4. COMMENT INPUT */}
      <CommentInput
        value={commentInput}
        onChange={setCommentInput}
        onSend={addComment}
        isSending={isAdding}
      />
    </div>
  );
}
