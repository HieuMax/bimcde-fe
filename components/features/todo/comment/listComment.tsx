import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { EllipsisVertical, File, Paperclip, X } from "lucide-react";
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
  const { post, delete: deleteApi } = useApi();
  const { user } = useAuth();
  const router = useRouter();

  //#region LOGIC
  //#region Attachment
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

    // Folder → mở folder
    if (!isFile) {
      return;
    }

    const fileExt = item.name.split(".").pop()?.toLowerCase();
    if (!fileExt) return;

    const IFC_FILES = ["ifc"];
    const DOC_FILES = ["docs", "pdf", "png", "jpg", "webp"];

    // IFC → 3D Viewer
    if (IFC_FILES.includes(fileExt)) {
      router.push(
        `/projects/${todoData}/viewer3d?urls=${encodeURIComponent(JSON.stringify([item.location]))}`,
      );
      return;
    }

    // DOC / PDF → Project Viewer
    if (DOC_FILES.includes(fileExt)) {
      router.push(`/projects/${todoData.projectId}/viewer/${item.fileId}`);
      return;
    }
  };
  //#endregion

  //#region COMMENT
  const onEditComment = (id: string) => {
    setEditingId(id);
  };

  const onSubmitComment = () => {
    if (!editingId) return;

    const dataItem = listCommentData.find(
      (item: any) => item._id === editingId,
    );
    if (!dataItem) return;

    const updateData = { ...dataItem, description: value };

    handleUpdateComment(updateData);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      handleDeleteComment(deleteTarget);
    }
    setDeleteTarget(null);
  };
  //#endregion

  //#region API
  const handleUpdateComment = async (data: any) => {
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
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDeleteComment = async (comment: any) => {
    try {
      const response = await deleteApi(`/todo/comment/delete/${comment._id}`);
      if (response?.success) {
        onCommentChange(true);
      } else {
        console.error("Failed to delete comment:", response?.error);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  //#endregion

  return (
    <>
      <div>
        <div className="pl-4 pr-2 border-t border-t-[#d0d0d7] items-center flex nowrap min-h-10 mt-2">
          <h5 className="overflow-hidden text-ellipsis whitespace-nowrap">
            Comments
          </h5>
        </div>
        {listCommentData.map((data: any, index: number) => (
          <div
            key={data._id ?? index}
            className="px-0 py-4 border-b border-b-[#d0d0d7]">
            <div className="px-4">
              <div className="p-0 text-sm min-h-10">
                <div className="flex items-center nowrap min-h-10 w-full">
                  <div className="  mr-2">
                    <Avatar>
                      <AvatarImage alt="@shadcn" />
                      <AvatarFallback>
                        {" "}
                        {data?.createdBy?.fullName
                          ?.substring(0, 2)
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="overflow-hidden text-ellipsis nowrap w-full">
                    <div className="text-ellipsis nowrap whitespace-nowrap ">
                      {data.createdBy?.fullName}
                    </div>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {new Date(data?.createdOn).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="focus-visible:ring-0">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onEditComment(data._id)}
                        className="cursor-pointer">
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setDeleteTarget(data)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2">
                  <p className="whitespace-nowrap text-inherit break-words ">
                    {data.description}
                  </p>

                  {editingId === data._id && (
                    <>
                      <Textarea
                        className="focus-visible:ring-0 mb-2"
                        rows={2}
                        defaultValue={data.description}
                        onChange={(e) => setValue(e.target.value)}></Textarea>
                      <div className="flex items-center justify-between mt-3">
                        <Button
                          onClick={onToggleAttachment}
                          className="text-gray-500 bg-transparent hover:bg-gray-200 px-3 py-2 rounded-md shadow-none">
                          <Paperclip></Paperclip>
                        </Button>

                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                            }}
                            className="bg-transparent text-gray-600 shadow-none hover:bg-gray-200 px-4">
                            Cancel
                          </Button>

                          <Button
                            onClick={onSubmitComment}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 px-5 text-white">
                            Save
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {data.attachments?.map((file: any, fileIndex: number) => (
                    <div
                      key={`${file._id}-${fileIndex}`}
                      className="flex items-center nowrap text-xs min-h-10 gap-2 cursor-pointer">
                      <File></File>
                      <span
                        onClick={() => handleViewFile(file)}
                        className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
                        {file.name}
                      </span>
                      <X
                        onClick={() =>
                          handleRemoveAttachment(index, fileIndex)
                        }></X>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AttachmentDialog
        open={openAttachment}
        onOpenChange={setOpenAttachment}
        userId={user?._id || ""}
        projectId={todoData.projectId}
        onAttach={handleSubmitAttachment}></AttachmentDialog>
    </>
  );
}
