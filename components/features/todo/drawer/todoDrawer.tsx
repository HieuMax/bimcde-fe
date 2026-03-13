"use client";

import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowLeft,
  EllipsisVertical,
  File,
  List,
  MessageSquarePlus,
  Paperclip,
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
import AttachmentDialog from "./attachmentDialog";
import TodoDetails from "./todoDetails";
import EditTodoDrawer from "./editTodoDrawer";
import { useAuth } from "@/app/context/authContext";
import CommentComponent from "../comment/comment";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const { post, get, delete: deleteApi } = useApi();
  const { user } = useAuth();

  const [isCommenting, setIsCommenting] = useState(false);
  const [isAttachment, setIsAttachment] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ListComment, setListComments] = useState<any[]>([]);

  const [comment, setComment] = useState("");

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
        setIsEdit(false);
        // window.location.reload();
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
    setIsCommenting(false);
    onClose();
  };

  const handleDeleteTodo = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteApi(`/todo/delete/${data._id}`);

      if (response.success) {
        setIsDeleteDialogOpen(false);
        window.location.reload();
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

  const handleAddAttachments = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
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
        setListComments(listComment);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const userCreateBy = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };
    const newComment = {
      todoId: data._id,
      description: comment.trim(),
      createdBy: userCreateBy,
      modifiedBy: userCreateBy,
    };
    try {
      const response = await post(`/todo/comment/createComment/${data._id}`, {
        ...newComment,
      });

      if (response.success) {
        getAllComment();
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

  const onCommentChange = async (data: any) => {
    console.log(data);

    const userAction = {
      userId: user?._id || "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
    };
    const updateData = {
      moodifiedOn: new Date(),
      description: data.description,
      modifiedBy: userAction,
    };
    try {
      const response = await post(
        `/todo/comment/update/${data._id}`,
        updateData,
      );
      if (response.success) {
        getAllComment();
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const onDeleteComment = async (comment: any) => {
    try {
      const response = await deleteApi(`/todo/comment/delete/${comment._id}`);
      if (response?.success) {
        getAllComment();
      } else {
        console.error("Failed to delete comment:", response?.error);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
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
                    <div className="flex items-center nowrap text-xs min-h-10 gap-2 cursor-pointer">
                      <File></File>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap w-full">
                        123
                      </span>
                      <EllipsisVertical></EllipsisVertical>
                    </div>
                  </div>

                  <p className="text-sm font-normal text-muted-foreground">
                    This ToDo doesn't have any attachments.
                  </p>
                </div>

                {ListComment.length > 0 && (
                  <CommentComponent
                    data={ListComment}
                    onCommentChange={onCommentChange}
                    onDeleteComment={onDeleteComment}
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
          ) : !isCommenting ? (
            // ADD COMMENT BUTTON
            <div
              onClick={() => setIsCommenting(true)}
              className="mt-auto border-t border-gray-300 flex cursor-pointer nowrap items-center max-h-16 p-4 hover:bg-gray-200">
              <MessageSquarePlus
                width={40}
                color="#00437b"
                className="text-blue-500"
              />
              <span className="text-sm text-gray-500 italic">
                Add a comment…
              </span>
            </div>
          ) : (
            // COMMENT INPUT UI
            <div className="mt-auto border-t border-gray-300 px-3 py-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />

              <div className="flex items-center justify-between mt-3">
                <Button className="text-gray-500 bg-transparent hover:bg-gray-200 px-3 py-2 rounded-md shadow-none">
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

      <AttachmentDialog
        isOpen={isAttachment}
        onClose={onToggleAttachment}
        onAddAttachments={handleAddAttachments}></AttachmentDialog>
    </>
  );
}
