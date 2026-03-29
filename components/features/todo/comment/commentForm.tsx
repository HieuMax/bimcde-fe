import { useAuth } from "@/app/context/authContext";
import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { File, MessageSquarePlus, Paperclip, X } from "lucide-react";
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

  const { user } = useAuth();
  const { post } = useApi();

  //#region hamdle attachment
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
  //#endregion

  //#region handle comment
  const handleAddComment = async () => {
    if (!comment.trim()) return;

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
      } else {
        alert("Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("An error occurred while adding comment.");
    } finally {
      setComment("");
      setIsCommenting(false);
    }
  };
  //#endregion
  //#region Comment Button
  if (!isCommenting) {
    return (
      // ADD COMMENT BUTTON
      <div
        onClick={() => setIsCommenting(true)}
        className="mt-auto border-t border-gray-300 flex cursor-pointer nowrap items-center max-h-16 p-4 hover:bg-gray-200">
        <MessageSquarePlus
          width={40}
          color="#00437b"
          className="text-blue-500"
        />
        <span className="text-sm text-gray-500 italic">Add a comment…</span>
      </div>
    );
  }
  //#endregion

  //#region COMMENT FORM
  return (
    <>
      <div className="mt-auto border-t border-gray-300 px-3 py-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />

        <div className="max-h-40 overflow-y-auto">
          {attachments.map((file, index) => (
            <div
              key={`${file.fileId}-${index}`}
              className="flex items-center nowrap text-xs min-h-10 gap-2 cursor-pointer">
              <File></File>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
                {file.name}
              </span>
              <X onClick={() => handleRemoveAttachment(index)}></X>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <Button
            onClick={onToggleAttachment}
            className="text-gray-500 bg-transparent hover:bg-gray-200 px-3 py-2 rounded-md shadow-none">
            <Paperclip></Paperclip>
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setIsCommenting(false);
                setComment("");
              }}
              className="bg-transparent text-gray-600 shadow-none hover:bg-gray-200 px-4">
              Cancel
            </Button>

            <Button
              onClick={handleAddComment}
              disabled={!comment.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 px-5 text-white">
              Comment
            </Button>
          </div>
        </div>
      </div>
      <AttachmentDialog
        open={openAttachment}
        onOpenChange={setOpenAttachment}
        userId={user?._id || ""}
        projectId={todoData.projectId}
        onAttach={handleSubmitAttachment}></AttachmentDialog>
    </>
  );
}

//#endregion
