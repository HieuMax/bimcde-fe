"use client";

import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  EllipsisVertical,
  File,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AttachmentDialog } from "./attachmentDialog";
import TodoDetails from "./todoDetails";
import EditTodoDrawer from "./editTodoDrawer";
import { useAuth } from "@/app/context/authContext";
import ListCommentComponent from "../comment/listComment";
import CommentFormComponent from "../comment/commentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const status = [
  { name: "New", value: "new" },
  { name: "In progress", value: "in_progress" },
  {
    name: "Waiting",
    value: "waiting",
  },
  { name: "Done", value: "done" },
  {
    name: "Closed",
    value: "closed",
  },
];

export default function TodoDrawer({
  isOpen,
  onClose,
  data,
  priority,
  type,
  users,
  tag,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  priority: any[];
  type: any[];
  users: any[];
  tag: any[];
}) {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveAttachmentDialogOpen, setIsRemoveAttachmentDialogOpen] =
    useState(false);
  const [AttachmentDelete, setAttachmentDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { post, get, delete: deleteApi } = useApi();
  const { user } = useAuth();
  const router = useRouter();

  const [isAttachment, setIsAttachment] = useState(false);
  const [ListCommentData, setListCommentData] = useState<any[]>([]);
  const [ListAttachment, setListAttachments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedUsers: [] as any[],
    selectedTags: [] as any[],
    priorityId: "",
    status: "",
    dueDate: "" as string | Date,
    typeId: "",
    completion: "",
  });

  const [showError, setShowError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with data when drawer opens or data changes

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        if (!isOpen) return;
        await InitialData();
        await getAllComment();
        await getAllAttachment();
      };

      fetchData();
    }
  }, [isOpen, data]);

  const InitialData = async () => {
    if (isOpen && data) {
      // Convert dueDate string to Date object if it exists
      let dueDateValue: Date | string = "";
      if (data.dueDate) {
        const parsedDate = new Date(data.dueDate);
        dueDateValue = !isNaN(parsedDate.getTime()) ? parsedDate : "";
      }

      setFormData({
        name: data.name || "",
        description: data.description || "",
        selectedUsers:
          data.assignees?.map((u: any) => u.assigneeId || u._id) || [],
        selectedTags: data.tag?.map((t: any) => t.tagId || t._id) || [],
        priorityId: data.priority?.priorityId || data.priority?._id || "",
        status: data.status || "",
        dueDate: dueDateValue as string | Date,
        typeId: data.typeTopic?.typeId || data.typeTopic?._id || "",
        completion: data.completion?.toString() || "",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setShowError(false);
  };

  const handleSaveTodo = async () => {
    if (!formData.name.trim()) {
      setShowError(true);
      return;
    }

    setIsSaving(true);

    const selectedUserObjects = users.filter((user) =>
      formData.selectedUsers.includes(user._id),
    );

    const selectedTagObjects = tag.filter((t) =>
      formData.selectedTags.includes(t._id),
    );

    const selectedPriority = priority.find(
      (p) => formData.priorityId === p._id,
    );
    const selectedType = type.find((p) => formData.typeId === p._id);

    const assignessUpdate = selectedUserObjects?.map((a) => ({
      assigneeId: a.userId || a._id,
      name: a.name,
      type: a.type,
      label: a.email || a.name,
    }));

    console.log(selectedUserObjects);

    const tagUpdate = selectedTagObjects?.map((t) => ({
      tagId: t._id,
      name: t.name,
    }));

    const priorityUpdate = selectedPriority
      ? {
          priorityId: selectedPriority._id,
          name: selectedPriority.name,
          color: selectedPriority.color,
        }
      : null;

    const typeUpdate = selectedType
      ? {
          typeId: selectedType._id,
          name: selectedType.name,
        }
      : null;
    try {
      // Format dueDate to yyyy-MM-dd string if it's a Date object
      let formattedDueDate = "";
      const dueDate = formData.dueDate;
      if (dueDate) {
        if (dueDate instanceof Date) {
          formattedDueDate = format(dueDate, "yyyy-MM-dd");
        } else if (typeof dueDate === "string") {
          formattedDueDate = dueDate;
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        assignees: assignessUpdate,
        tag: tagUpdate,
        status: formData.status,
        priority: priorityUpdate,
        dueDate: formattedDueDate,
        typeTopic: typeUpdate,
        completion: parseInt(formData.completion) || 0,
      };

      const response = await post(`/todo/update/${data._id}`, payload);

      if (response.success) {
        handleCloseDrawer();
      } else {
        alert("Failed to save todo. Please try again.");
      }
    } catch (error) {
      console.error("Error saving todo:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsEdit(false);
    onClose();
  };

  const handleDeleteTodo = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteApi(`/todo/delete/${data._id}`);

      if (response.success) {
        setIsDeleteDialogOpen(false);
        handleCloseDrawer();
      } else {
        alert("Failed to delete todo. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const onToggleAttachment = () => {
    setIsAttachment((prev) => !prev);
  };

  const onDeleteTodo = () => {
    setIsDeleteDialogOpen(true);
  };

  //#region COMMENT  FUNCTION
  const getAllComment = async () => {
    try {
      console.log("Fetching comments for todo ID:", data._id);
      const response = await get(`/todo/comment/getComment/${data._id}`);
      if (response.success) {
        const listComment = response.result;
        setListCommentData(listComment);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const onLoadComment = () => {
    getAllComment();
  };

  //#endregion

  //#region ATTACHMENT FUNCTION
  const getAllAttachment = async () => {
    try {
      const response = await get(`/todo/attachment/${data._id}`);
      if (response) {
        const listAttachment = response;
        setListAttachments(listAttachment);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleAddAttachments = async (newFiles: any[]) => {
    const files = newFiles.map((file) => ({
      ...file,
      todoId: data._id,
      location: file.url,
    }));
    try {
      const response = await post(`/todo/attachment/add`, files);

      if (response) {
        getAllAttachment();
      } else {
        alert("Failed to add attachment.");
      }
    } catch (error) {
      console.error("Error adding attachment:", error);
      alert("An error occurred while adding attachment.");
    } finally {
    }
  };

  const onRemoveAttachment = (file: any) => {
    setAttachmentDelete(file);
    setIsRemoveAttachmentDialogOpen(true);
  };

  const handleDeleteAttachment = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteApi(
        `/todo/attachment/delete/${AttachmentDelete._id}`,
      );

      if (response) {
        setIsDeleteDialogOpen(false);
        getAllAttachment();
      } else {
        alert("Failed to delete attachment. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("An error occurred while deleting the attachment.");
    } finally {
      setIsDeleting(false);
    }
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
        `/projects/${data.projectId}/viewer3d?urls=${encodeURIComponent(JSON.stringify([item.location]))}`,
      );
      return;
    }

    // DOC / PDF → Project Viewer
    if (DOC_FILES.includes(fileExt)) {
      router.push(`/projects/${data.projectId}/viewer/${item.fileId}`);
      return;
    }
  };

  //#endregion
  const statusLabel = status.find((s) => s.value === data.status)?.name || "--";

  return (
    <>
      {isOpen && (
        <div className=" flex flex-col bg-white nowrap h-full ml-auto  min-w-80 relative shadow ">
          <div className="flex border-b border-b-[#d0d0d7] nowrap p-4 items-center ">
            {!isEdit ? (
              <>
                <div className="items-center flex nowrap flex-1 overflow-hidden">
                  <h3 className="text-lg">{data.name}</h3>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    onClick={() => setIsEdit(true)}
                    className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
                    <Pencil className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={handleCloseDrawer}
                    className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEdit(false)}
                  className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex nowrap items-center flex-1 overflow-hidden">
                  <h3>Edit ToDo</h3>
                </div>
                <Button
                  onClick={handleCloseDrawer}
                  className="bg-transparent shadow-none text-gray-500 hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
          <div className="overflow-y-auto flex flex-col nowrap h-full pb-16">
            {!isEdit ? (
              <>
                <TodoDetails
                  data={data}
                  statusLabel={statusLabel}
                  onDelete={onDeleteTodo}
                />
                <div className=" pl-4 pr-2 mt-2 border-t border-t-[#d0d0d7] ">
                  <div className="flex items-center justify-between  nowrap">
                    <h5 className="overflow-hidden text-ellipsis whitespace-nowrap">
                      Attachments
                    </h5>
                    <div className="flex flex-nowrap">
                      <Button
                        onClick={onToggleAttachment}
                        className="bg-transparent hover:bg-gray-200 rounded-full text-gray-700 shadow-none">
                        <Plus></Plus>
                      </Button>
                      <Button
                        onClick={onToggleAttachment}
                        className="bg-transparent hover:bg-gray-200   rounded-none text-gray-700 shadow-none">
                        <EllipsisVertical></EllipsisVertical>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col flex-nowrap pb-2">
                    {ListAttachment.length === 0 && (
                      <div className="text-sm text-muted-foreground italic px-2">
                        No files attached.
                      </div>
                    )}
                    {ListAttachment.map((file, index) => (
                      <div
                        key={file._id}
                        className="flex items-center nowrap text-xs min-h-10 gap-2 ">
                        <File></File>
                        <span
                          onClick={() => handleViewFile(file)}
                          className="overflow-hidden cursor-pointer text-ellipsis whitespace-nowrap w-full">
                          {file.name}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="focus-visible:ring-0">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="cursor-pointer">
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => onRemoveAttachment(file)}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>

                {ListCommentData.length > 0 && (
                  <ListCommentComponent
                    listCommentData={ListCommentData}
                    todoData={data}
                    onCommentChange={onLoadComment}
                  />
                )}
              </>
            ) : (
              <>
                <EditTodoDrawer
                  formData={formData}
                  handleInputChange={handleInputChange}
                  users={users}
                  priority={priority}
                  type={type}
                  tag={tag}
                  showError={showError}
                  status={status}
                />
              </>
            )}
          </div>
          {isEdit ? (
            // EDIT TODO ACTIONS
            <div className="flex justify-start gap-3 mt-auto py-4 border-t border-gray-300 px-3">
              <Button
                onClick={() => setIsEdit(false)}
                className="bg-transparent text-gray-600 shadow-none hover:bg-gray-200 px-6 rounded-lg py-2">
                Cancel
              </Button>
              <Button
                onClick={handleSaveTodo}
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-800 disabled:bg-sky-400 px-6 rounded-lg py-2 text-white">
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <CommentFormComponent
              data={data}
              todoData={data}
              onDataChange={onLoadComment}></CommentFormComponent>
          )}
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Todo</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this todo? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTodo}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRemoveAttachmentDialogOpen}
        onOpenChange={setIsRemoveAttachmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove Attachment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove the selected attachment(s)? This
            cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AttachmentDialog
        open={isAttachment}
        onOpenChange={setIsAttachment}
        userId={user?._id || ""}
        projectId={data.projectId}
        onAttach={handleAddAttachments}></AttachmentDialog>
    </>
  );
}
