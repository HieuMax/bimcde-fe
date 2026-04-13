import { useAuth } from "@/app/context/authContext";
import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { File, MessageSquarePlus, Paperclip, X, SendIcon } from "lucide-react";
import { useState } from "react";
import { AttachmentDialog } from "../drawer/attachmentDialog";

interface Props {
  data: any;
  todoData: any;
  onDataChange: (changed: boolean) => void;
}

export default function CommentFormComponent({
  data,
  todoData,
  onDataChange,
}: Props) {
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [openAttachment, setOpenAttachment] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { post } = useApi();

  const onToggleAttachment = () => {
    setOpenAttachment((prev) => !prev);
  };

  const handleSubmitAttachment = (newFiles: any[]) => {
    const updatedFiles = newFiles.map((file) => ({
      ...file,
      location: file.url,
    }));

    setAttachments((prev) => [...prev, ...updatedFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    setIsLoading(true);
    const userCreateBy = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };
    const newComment = {
      todoId: data._id as any,
      description: comment.trim(),
      createdBy: userCreateBy,
      modifiedBy: userCreateBy,
      attachments: attachments,
    };
    try {
      const response = await post(`/todo/comment/createComment/${data._id}`, {
        ...newComment,
      });

      if (response.success) {
        onDataChange(true);
        setComment("");
        setAttachments([]);
        setIsCommenting(false);
      } else {
        alert("Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("An error occurred while adding comment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCommenting) {
    return (
      <div
        onClick={() => setIsCommenting(true)}
        className="border-t border-border flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">Add a comment…</span>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-border space-y-4 p-4">
        {/* Comment Input */}
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-20 resize-none border border-input rounded-lg bg-background p-3 text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50"
            rows={4}
          />
        </div>

        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Attachments ({attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.fileId}-${index}`}
                  className="group inline-flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-xs transition-colors hover:border-primary/30 hover:bg-muted/80">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="max-w-xs truncate text-foreground">
                    {file.name}
                  </span>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="ml-1 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            onClick={onToggleAttachment}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            <span className="hidden sm:inline">Attach</span>
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setIsCommenting(false);
                setComment("");
                setAttachments([]);
              }}
              variant="outline"
              size="sm"
              disabled={isLoading}>
              Cancel
            </Button>

            <Button
              onClick={handleAddComment}
              disabled={!comment.trim() || isLoading}
              size="sm"
              className="gap-2 bg-[#406D87] hover:bg-[#345a70]">
              {isLoading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="hidden sm:inline">Posting...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Comment</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <AttachmentDialog
        open={openAttachment}
        onOpenChange={setOpenAttachment}
        userId={user?._id || ""}
        projectId={todoData.projectId}
        onAttach={handleSubmitAttachment}
      />
    </>
  );
}
