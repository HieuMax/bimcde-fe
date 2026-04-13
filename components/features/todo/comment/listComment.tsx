import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { EllipsisVertical, File, Paperclip, X, CheckIcon } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/app/context/authContext";
import { useApi } from "@/app/hooks/useApi";
import { AttachmentDialog } from "../drawer/attachmentDialog";
import { useRouter } from "next/navigation";

interface commentProps {
  listCommentData: any[];
  todoData: any;
  onCommentChange: (changed: boolean) => void;
}

export default function ListCommentComponent({
  listCommentData,
  todoData,
  onCommentChange,
}: commentProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [openAttachment, setOpenAttachment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { post, delete: deleteApi } = useApi();
  const { user } = useAuth();
  const router = useRouter();

  const onToggleAttachment = () => {
    setOpenAttachment((prev) => !prev);
  };

  const handleSubmitAttachment = (newFiles: any[]) => {
    const index = listCommentData.findIndex((c) => c._id === editingId);
    if (index === -1) return;

    const updatedFiles = newFiles.map((file) => ({
      ...file,
      location: file.url,
    }));

    listCommentData[index].attachments = [
      ...(listCommentData[index].attachments || []),
      ...updatedFiles,
    ];
  };

  const handleRemoveAttachment = (commentIndex: number, indexFile: number) => {
    if (commentIndex === -1) return;

    const attachments = listCommentData[commentIndex].attachments || [];
    attachments.splice(indexFile, 1);

    listCommentData[commentIndex].attachments = [...attachments];
    const comment = listCommentData[commentIndex];
    handleUpdateComment(comment);
  };

  const handleViewFile = (item: any) => {
    const isFile = "mimeType" in item;

    if (!isFile) {
      return;
    }

    const fileExt = item.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return;

    const IFC_FILES = ["ifc"];
    const DOC_FILES = ["docs", "pdf", "png", "jpg", "webp"];

    if (IFC_FILES.includes(fileExt)) {
      router.push(
        `/projects/${todoData}/viewer3d?urls=${encodeURIComponent(JSON.stringify([item.location]))}`,
      );
      return;
    }

    if (DOC_FILES.includes(fileExt)) {
      router.push(`/projects/${todoData.projectId}/viewer/${item.fileId}`);
      return;
    }
  };

  const onEditComment = (id: string, description: string) => {
    setEditingId(id);
    setValue(description);
  };

  const onSubmitComment = () => {
    if (!editingId || !value.trim()) return;

    const dataItem = listCommentData.find(
      (item: any) => item._id === editingId,
    );
    if (!dataItem) return;

    const updateData = { ...dataItem, description: value };
    handleUpdateComment(updateData);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      handleDeleteComment(deleteTarget);
    }
    setDeleteTarget(null);
  };

  const handleUpdateComment = async (data: any) => {
    setIsLoading(true);
    const userAction = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };
    const updateData = {
      moodifiedOn: new Date(),
      description: data.description,
      attachments: data.attachments,
      modifiedBy: userAction,
    };
    try {
      const response = await post(
        `/todo/comment/update/${data._id}`,
        updateData,
      );
      if (response.success) {
        onCommentChange(true);
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (comment: any) => {
    setIsLoading(true);
    try {
      const response = await deleteApi(`/todo/comment/delete/${comment._id}`);
      if (response?.success) {
        onCommentChange(true);
      } else {
        console.error("Failed to delete comment:", response?.error);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-0">
        {/* Comments Header */}
        <div className="border-t border-border flex items-center px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Comments ({listCommentData.length})
          </h3>
        </div>

        {/* Comments List */}
        {listCommentData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          listCommentData.map((data: any, index: number) => (
            <div
              key={data._id ?? index}
              className="border-b border-border px-4 py-4 transition-colors hover:bg-muted/30">
              {/* Comment Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage alt={data?.createdBy?.fullName} />
                    <AvatarFallback className="text-xs">
                      {data?.createdBy?.fullName
                        ?.substring(0, 2)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">
                        {data.createdBy?.fullName || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(data?.createdOn).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Comment Content */}
                    {editingId === data._id ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="Edit your comment..."
                          className="min-h-8 resize-none"
                          rows={4}
                        />

                        {/* Attachment Chips */}
                        {data.attachments?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase">
                              Attachments
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {data.attachments.map(
                                (file: any, fileIndex: number) => (
                                  <div
                                    key={`${file._id}-${fileIndex}`}
                                    className="max-w-full inline-flex items-center gap-2 rounded-md border border-input bg-muted px-2 py-1.5 text-xs">
                                    <File className="h-3 w-3 text-muted-foreground" />
                                    <span className="max-w-xs truncate">
                                      {file.name}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleRemoveAttachment(index, fileIndex)
                                      }
                                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Edit Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            onClick={onToggleAttachment}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-foreground">
                            <Paperclip className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs">
                              Add
                            </span>
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => setEditingId(null)}
                              variant="outline"
                              size="sm"
                              disabled={isLoading}>
                              Cancel
                            </Button>

                            <Button
                              onClick={onSubmitComment}
                              disabled={!value.trim() || isLoading}
                              size="sm"
                              className="gap-2">
                              {isLoading ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  <span className="hidden sm:inline">
                                    Saving...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckIcon className="h-4 w-4" />
                                  <span className="hidden sm:inline">Save</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-foreground mt-2 break-words whitespace-pre-wrap">
                          {data.description}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {editingId !== data._id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          onEditComment(data._id, data.description)
                        }
                        className="cursor-pointer text-sm">
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(data)}
                        className="cursor-pointer text-sm text-destructive focus:text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {/* View Attachments */}
              {data.attachments?.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Attachments ({data.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.attachments.map((file: any, fileIndex: number) => (
                      <button
                        key={`${file._id}-${fileIndex}`}
                        onClick={() => handleViewFile(file)}
                        className="inline-flex max-w-full items-center gap-2 rounded-md border border-input bg-muted px-2 py-1.5 text-xs transition-colors hover:bg-muted/80 hover:border-primary/30">
                        <File className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-xs truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attachment Dialog */}
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
