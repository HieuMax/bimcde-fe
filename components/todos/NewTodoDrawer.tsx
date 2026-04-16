"use client";

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AxiosError } from "axios"
import "./todoDrawer.css"

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar, Eye, LinkIcon, MoveLeft, Plus, Trash2,
  Paperclip, Download, X, File as FileIcon,
  Pencil
} from "lucide-react";
import { todoService } from "@/services/todo3d.service";
import { topicSettingsService } from "@/services/topicSettings.service";
import {
  IAssigneeTodo,
  ITagTodo,
  ITodo,
  IPriority,
  IType,
} from "@/types/todo3d";
import { topicService } from "@/services/topic3d.service"

import { AttachFileDialog } from "./AttachFileDialog";
import { AssignedSelector } from "./AssignedSelector";
import { useAuth } from "@/app/context/authContext";
import { useApi } from "@/app/hooks/useApi";
import CommentFormComponent from "@/components/features/todo/comment/commentForm";
import ListCommentComponent from "@/components/features/todo/comment/listComment";
import { TagSelector } from "./TagsSelector";

interface NewTodoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreView?: (viewState: any) => void;
  projectId: string;
  todoToEdit?: ITodo | null;
  mode: "view" | "edit" | "create";
  initialData?: {
    items?: {
      fileUrl: string;
      modelId: string;
      expressId: string[];
    }[];
    title?: string;
    viewState?: any;
  } | null;
  currentSelection?: any[]
  /** When set (e.g. “Add todo” from a topic), topic is linked automatically and the topic picker is hidden. */
  presetTopicId?: string | null
}

// Helper format size
const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function NewTodoDrawer({
  open,
  onOpenChange,
  onRestoreView,
  projectId,
  todoToEdit,
  mode,
  initialData,
  currentSelection = [],
  presetTopicId = null,
}: NewTodoDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [commentList, setCommentList] = useState<any[]>([]);

  // State for assignees
  const [selectedAssigneeOptions, setSelectedAssigneeOptions] = useState<
    IAssigneeTodo[]
  >([]);

  const [selectedTagsOptions, setSelectedTagsOptions] = useState<ITagTodo[]>(
    [],
  );
  const [availableAssigneeOptions, setAvailableAssigneeOptions] = useState<
    IAssigneeTodo[]
  >([]);

  // State for topic options (priority, type, status)
  const [topicPriorities, setTopicPriorities] = useState<IPriority[]>([]);
  const [topicTypes, setTopicTypes] = useState<IType[]>([]);
  const [topicStatuses, setTopicStatuses] = useState<any[]>([]);

  

  const { get } = useApi();
  // Initial state helper
  const defaultState = {
    title: "",
    description: "",
    dueDate: "",
    priority: null as IPriority | null,
    completion: 0,
    assignees: [] as IAssigneeTodo[],
    type: null as IType | null,
    tags: [] as ITagTodo[],
    status: "" as string,
    items: [] as { fileUrl: string; modelId: string; expressId: string[] }[],
    viewState: null as any,
  };

  const [currentMode, setCurrentMode] = useState(mode);

  useEffect(() => {
    if (open) {
      setCurrentMode(mode);
    }
  }, [mode, open]);

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString() : ""
  const [formData, setFormData] = useState(defaultState)
  const [linkedTopicId, setLinkedTopicId] = useState<string>("__none__")
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { data: linkableTopics = [] } = useQuery({
    queryKey: ["topic3d-linkable", projectId],
    queryFn: () => topicService.getLinkableTopics(projectId),
    enabled:
      open &&
      !presetTopicId &&
      (currentMode === "create" || currentMode === "edit"),
  })

  const linkedTopicItemId =
    (todoToEdit as any)?.topicItemId ?? (todoToEdit as any)?.topicId ?? null;

  const { data: linkedTopicMeta } = useQuery({
    queryKey: ["topic3d", linkedTopicItemId],
    queryFn: () => topicService.getTopicById(String(linkedTopicItemId)),
    enabled: open && !!linkedTopicItemId && currentMode === "view",
  })

  // Helper
  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      return parts[parts.length - 1];
    } catch {
      return "Unknown Model";
    }
  };

  // Effect to populate form when opening
  useEffect(() => {
    if (open) {
      if (todoToEdit) {
        // Format date to YYYY-MM-DD for input[type="date"]
        let formattedDate = "";
        if (todoToEdit.dueDate) {
          const d = new Date(todoToEdit.dueDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
          }
        }
        setFormData({
          title: todoToEdit.title || "",
          description: todoToEdit.description || "",
          dueDate: formattedDate,
          priority: todoToEdit.priority || null,
          completion: todoToEdit.completion || 0,
          assignees: todoToEdit.assignees || [],
          type: todoToEdit.type || null,
          status: (todoToEdit.status as any) || null,
          tags: todoToEdit.tags || [],
          items: todoToEdit?.items || [],
          viewState: todoToEdit?.viewState || null,
        });
        setAttachments(todoToEdit.attachments || []);
      } else if (initialData && mode === "create") {
        setFormData({
          ...defaultState,
          items: initialData?.items || [],
          viewState: initialData?.viewState || null,
        });
        setAttachments([]);
        setSelectedAssigneeOptions([]);
        setSelectedTagsOptions([]);

      } else {
        // Reset to default if creating new
        setFormData(defaultState);
        setAttachments([]);
        setSelectedAssigneeOptions([]);
        setSelectedTagsOptions([]);

      }
    }
  }, [open, todoToEdit]);

  // Sync selectedAssigneeOptions when todoToEdit or availableAssigneeOptions changes
  useEffect(() => {
    if (todoToEdit) {
      // Sync assignees
      const assigneeOptions = availableAssigneeOptions.filter((o) =>
        todoToEdit.assignees?.some((a) => a.assigneeId === o.assigneeId),
      );
      setSelectedAssigneeOptions(assigneeOptions);

      // Sync tags from formData
      setSelectedTagsOptions(formData.tags || []);
    }
  }, [todoToEdit, availableAssigneeOptions]);

  // Reset mode to view when todoToEdit changes (unless creating)
  useEffect(() => {
    if (todoToEdit && mode !== "create") {
      setCurrentMode("view");
    }
  }, [todoToEdit, mode]);

  // Fetch topic settings (priority, type, status) when opening
  useEffect(() => {
    if (open) {
      const fetchTopicSettings = async () => {
        try {
          const settings = await topicSettingsService.getAll(projectId);

          // Map API response to IPriority interface
          const priorities: IPriority[] = (settings.topicPriorities || []).map(
            (p: any) => ({
              priorityId: p._id || "",
              name: p.name || "",
              color: p.color || "",
            }),
          );

          // Map API response to IType interface
          const types: IType[] = (settings.topicTypes || []).map((t: any) => ({
            typeId: t._id || "",
            name: t.name || "",
          }));

          setTopicPriorities(priorities);
          setTopicTypes(types);
          setTopicStatuses(settings.topicStatuses || []);
        } catch (error) {
          console.error("Failed to fetch topic settings:", error);
        }
      };
      void fetchTopicSettings();
    }
  }, [open, projectId]);

  // Fetch assignee options when opening
  useEffect(() => {
    if (open) {
      const fetchAssigneeOptions = async () => {
        try {
          const [membersRes, groupsRes] = await Promise.all([
            get(`/projects/${projectId}/members`),
            get(`/team/getGroup/${projectId}`),
          ]);

          const nextOptions: IAssigneeTodo[] = [];

          const members = membersRes.result || [];
          members.forEach((m: any) => {
            if (m.userId) {
              nextOptions.push({
                assigneeId: m.userId,
                name: m.fullName,
                type: "user",
                label: m.email,
              });
            }
          });

          const groups = groupsRes.result || [];
          groups.forEach((g: any) => {
            nextOptions.push({
              assigneeId: g._id,
              name: g.name,
              type: "group",
            });
          });

          setAvailableAssigneeOptions(nextOptions);

          // Set selected options based on latest formData (user edits) first,
          // fallback to todoToEdit value for initial load.
          const currentAssignees =
            (formData.assignees && formData.assignees.length > 0
              ? formData.assignees
              : todoToEdit?.assignees) || [];

          const selected = nextOptions.filter((o) =>
            currentAssignees.some((a) => a.assigneeId === o.assigneeId),
          );
          setSelectedAssigneeOptions(selected);
        } catch (error) {
          console.error("Failed to fetch assignee options:", error);
        }
      };

      fetchAssigneeOptions();
    }
  }, [open, projectId, todoToEdit]);

  useEffect(() => {
    if (!open) return
    if (presetTopicId) {
      setLinkedTopicId(presetTopicId)
      return
    }
    const tid =
      (todoToEdit as any)?.topicItemId ?? (todoToEdit as any)?.topicId ?? null;
    if (tid) setLinkedTopicId(String(tid));
    else setLinkedTopicId("__none__");
  }, [open, todoToEdit, presetTopicId])

  const createMutation = useMutation({
    mutationFn: todoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      queryClient.invalidateQueries({ queryKey: ["topic-linked-open-todos"] })
      toast.success("Todo created successfully")
      handleCloseDrawer()
      setFormData(defaultState)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to create todo";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => todoService.update(todoToEdit!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      queryClient.invalidateQueries({ queryKey: ["topic-linked-open-todos"] })
      toast.success("Todo updated successfully")
      handleCloseDrawer()
      setFormData(defaultState)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update todo";
      toast.error(msg);
    },
  });

  const handleSaveTodo = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    // // Parse tags
    // const tagsArray = formData.tags
    //   .split(",")
    //   .map((t) => t.trim())
    //   .filter((t) => t.length > 0);

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      priority: formData.priority,
      completion: formData.completion,
      status: formData.status,
      assignees: formData.assignees.length > 0 ? formData.assignees : undefined,
      type: formData.type,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      projectId,
      viewState: formData.viewState || undefined,
      items: formData.items || [],
      attachments: attachments,
    }

    // Board todo links to TopicItem via `topicItemId`.
    if (presetTopicId) {
      payload.topicItemId = presetTopicId;
    } else if (todoToEdit) {
      payload.topicItemId = linkedTopicId === "__none__" ? null : linkedTopicId;
    } else if (linkedTopicId !== "__none__") {
      payload.topicItemId = linkedTopicId;
    }

    if (todoToEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCloseDrawer = () => {
    onOpenChange(false);

    setTimeout(() => {
      setCurrentMode("view");
    }, 100);
  };

  const handleAddAttachments = (newFiles: any[]) => {
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchComments = async () => {
    if (!todoToEdit?._id) {
      setCommentList([]);
      return;
    }

    try {
      const response = await get(`/todo/comment/getComment/${todoToEdit._id}`);
      if (response?.success) {
        setCommentList(response.result || []);
      } else {
        setCommentList([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentList([]);
    }
  };

  useEffect(() => {
    if (open && todoToEdit) {
      void fetchComments();
      // void fetchAttachments();
    } else {
      setCommentList([]);
      setAttachments([]);
    }
  }, [open, todoToEdit]);

  const handleCommentChange = () => {
    queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
    void fetchComments();
  };

  // --- LOGIC CONTROL LINKED ITEMS ---

  const handleRemoveLink = (fileUrl: string, idToRemove: string) => {
    setFormData((prev) => {
      const newItems =
        prev.items
          ?.map((group) => {
            if (group.fileUrl === fileUrl) {
              return {
                ...group,
                expressId: group.expressId.filter((id) => id !== idToRemove),
              };
            }
            return group;
          })
          .filter((group) => group.expressId.length > 0) || [];

      return { ...prev, items: newItems };
    });
  };

  const handleUnlinkAll = () => {
    setFormData((prev) => ({ ...prev, items: [] }));
  };

  const handleAddSelection = () => {
    console.log("Current Selection:", currentSelection);
    if (!currentSelection || currentSelection.length === 0) {
      toast.error("Please select objects in the 3D Viewer first.");
      return;
    }

    setFormData((prev) => {
      const currentItems = [...(prev.items || [])];

      currentSelection.forEach((sel) => {
        const fileUrl = sel.fileUrl;
        const expressId = String(sel.expressID);

        const existingGroup = currentItems.find((g) => g.fileUrl === fileUrl);

        if (existingGroup) {
          if (!existingGroup.expressId.includes(expressId)) {
            existingGroup.expressId.push(expressId);
          }
        } else {
          currentItems.push({
            fileUrl: fileUrl,
            modelId: String(sel.modelID),
            expressId: [expressId],
          });
        }
      });

      return { ...prev, items: currentItems };
    });

    toast.success(`Linked ${currentSelection.length} objects to this Todo.`);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleCloseDrawer} modal={false}>
      <SheetContent
        className="w-[400px] sm:w-[540px] flex flex-col p-0"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        style={{
          boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
          pointerEvents: "auto",
          zIndex: 50,
        }}>
        <SheetHeader className="border-b px-6 py-4 flex items-center">
          <div className="flex items-center gap-2 justify-start w-full">
            {currentMode === "edit" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMode("view")}>
                <MoveLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="text-lg font-semibold">
              {currentMode === "create"
                ? "New ToDo"
                : currentMode === "edit"
                  ? "Edit ToDo"
                  : "View ToDo"}
            </SheetTitle>
            {currentMode === "view" && todoToEdit?.status != "Closed" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMode("edit")}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 ">
          <div className="space-y-6">
            {/* --- THUMBNAIL --- */}
            {currentMode === "view" && formData.viewState?.thumbnail && (
              <div
                className="mb-4 mt-4 relative group cursor-pointer border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                onClick={() => {
                  if (onRestoreView) {
                    onRestoreView(formData.viewState);
                    toast.success("Restoring 3D View...");
                  }
                }}>
                <img
                  src={formData.viewState.thumbnail}
                  alt="3D Context View"
                  className="w-full h-48 object-cover bg-slate-100"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <Eye className="w-4 h-4" />
                    <span>Restore View</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                  3D Snapshot
                </div>
              </div>
            )}

            {/* Title */}
            {currentMode === "view" ? (
              <ViewField label="Title" value={formData.title} />
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm text-muted-foreground">
                  Title (required)
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
            )}

            {/* Description */}
            {currentMode === "view" ? (
              <ViewField label="Description" value={formData.description} />
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            )}

            {/* Due Date */}
            {currentMode === "view" ? (
              <ViewField
                label="Due date"
                value={formatDate(formData.dueDate)}
              />
            ) : (
              <div
                className="space-y-2"
                onClick={() => {
                  dateInputRef.current?.showPicker();
                }}>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="dueDate"
                    className="text-sm text-muted-foreground">
                    Due date
                  </Label>
                </div>
                <div className="relative w-full">
                  <Input
                    ref={dateInputRef}
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full pr-10 cursor-pointer"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                </div>
              </div>
            )}

            {/* Priority */}
            {currentMode === "view" ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <PriorityDot priority={formData.priority as any} />
                  <span className="capitalize">{formData.priority?.name}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-sm text-muted-foreground">
                  Priority
                </Label>

                <Select
                  value={formData.priority?.priorityId || ""}
                  onValueChange={(priorityId) => {
                    const priority =
                      topicPriorities.find(
                        (p) => p.priorityId === priorityId,
                      ) || formData.priority;
                    setFormData({ ...formData, priority });
                  }}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue>
                      {formData.priority && (
                        <div className="flex items-center gap-2">
                          <PriorityDot priority={formData.priority} />
                          <span className="capitalize">
                            {formData.priority?.name}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {topicPriorities.map((priority) => (
                      <SelectItem
                        key={priority.priorityId}
                        value={priority.priorityId}>
                        <div className="flex items-center gap-2">
                          <PriorityDot priority={priority} />
                          <span className="capitalize">{priority.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            {currentMode === "view" ? (
              <ViewField label="Status" value={formData.status} />
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="status"
                  className="text-sm text-muted-foreground">
                  Status
                </Label>

                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue>
                      {formData.status && (
                        <span className="capitalize">{formData.status}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {topicStatuses.map((status) => (
                      <SelectItem key={status.name} value={status.name}>
                        <span className="capitalize">{status.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Completion */}
            {currentMode === "view" ? (
              <ViewField label="Completion" value={`${formData.completion}%`} />
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="completion"
                  className="text-sm text-muted-foreground">
                  Completion %
                </Label>
                <Input
                  id="completion"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      completion: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}

            {/* Assignees */}
            {currentMode === "view" ? (
              <ViewField
                label="Assignees"
                value={selectedAssigneeOptions.map((o) => o.name).join(", ")}
              />
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Assignees
                </Label>
                <AssignedSelector
                  projectId={projectId}
                  initialOptions={selectedAssigneeOptions}
                  onChange={(ids, options) => {
                    setFormData((prev) => ({
                      ...prev,
                      assignees: options || [],
                    }));
                    setSelectedAssigneeOptions(options || []);
                  }}
                />
              </div>
            )}

            {/* Type */}
            {currentMode === "view" ? (
              <ViewField label="Type" value={formData.type?.name} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm text-muted-foreground">
                  Type
                </Label>
                <Select
                  value={formData.type?.typeId || ""}
                  onValueChange={(typeId) => {
                    const type =
                      topicTypes.find((t) => t.typeId === typeId) ||
                      formData.type;
                    setFormData({ ...formData, type });
                  }}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue>
                      {formData.type && (
                        <span className="capitalize">{formData.type.name}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {topicTypes.map((type) => (
                      <SelectItem key={type.typeId} value={type.typeId}>
                        <span className="capitalize">{type.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tags */}
            {currentMode === "view" ? (
              <ViewField
                label="Tags"
                value={selectedTagsOptions.map((o) => o.name).join(", ")}
              />
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tags</Label>

                <TagSelector
                  projectId={projectId}
                  initialOptions={selectedTagsOptions}
                  onChange={(ids, options) => {
                    setFormData((prev) => ({
                      ...prev,
                      tags: options || [], // ✅ đúng field
                    }));

                    setSelectedTagsOptions(options || []); // ✅ đúng state
                  }}
                />
              </div>
            )}

            {/* Linked Topic (optional) */}
            {currentMode === "view" && linkedTopicItemId ? (
              <ViewField
                label="Linked topic"
                value={
                  linkedTopicMeta
                    ? `${linkedTopicMeta.topicKey} — ${linkedTopicMeta.title}`
                    : String(linkedTopicItemId)
                }
              />
            ) : null}

            {!presetTopicId && (currentMode === "create" || currentMode === "edit") ? (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Link to a Topic (Optional)
                </Label>
                <Select
                  value={linkedTopicId}
                  onValueChange={setLinkedTopicId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {linkableTopics.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.topicKey} — {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {presetTopicId && currentMode === "create" ? (
              <p className="text-xs text-muted-foreground">
                This todo will be linked to the current topic automatically.
              </p>
            ) : null}

            {/* Created At & Updated At */}
            {todoToEdit && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                <ViewField
                  label="Created At"
                  value={formatDateTime(todoToEdit.createdAt)}
                />
                <ViewField
                  label="Updated At"
                  value={formatDateTime(todoToEdit.updatedAt)}
                />
              </div>
            )}

            {/* --- LINKED OBJECTS --- */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Linked Objects
                  <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full">
                    {formData.items?.reduce(
                      (acc, g) => acc + g.expressId.length,
                      0,
                    ) || 0}
                  </span>
                </h3>

                {/* Actions Bar */}
                {currentMode !== "view" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={handleUnlinkAll}
                      disabled={!formData.items?.length}>
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={handleAddSelection}>
                      <Plus className="w-3 h-3" /> Add Selection
                    </Button>
                  </div>
                )}
              </div>

              {/* List of Objects */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {(!formData.items || formData.items.length === 0) && (
                  <div className="text-sm text-muted-foreground italic px-2">
                    No objects linked. This is a global view issue.
                  </div>
                )}

                {formData.items?.map((group, gIdx) => (
                  <div key={gIdx} className="bg-slate-50 rounded-md p-2 border">
                    <div
                      className="text-xs font-semibold text-slate-700 mb-1 truncate"
                      title={group.fileUrl}>
                      File: {getFileName(group.fileUrl)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.expressId.map((id) => (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-white border rounded px-1.5 py-0.5 text-xs text-slate-600 shadow-sm group/tag">
                          <span>#{id}</span>
                          {currentMode !== "view" && (
                            <button
                              onClick={() =>
                                handleRemoveLink(group.fileUrl, id)
                              }
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ---------------------------------------------------------------------- */}

            {/* --- NEW SECTION: ATTACHMENTS --- */}
            {todoToEdit && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                    <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full">
                      {attachments.length}
                    </span>
                  </h3>

                  {currentMode === "edit" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={() => setIsAttachDialogOpen(true)}>
                      <Plus className="w-3 h-3" /> Add Files
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {attachments.length === 0 && (
                    <div className="text-sm text-muted-foreground italic px-2">
                      No files attached.
                    </div>
                  )}

                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md border bg-slate-50 hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">
                          <FileIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-700 truncate hover:underline">
                            {file.name}
                          </a>
                          <span className="text-xs text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Download Button */}
                        <a
                          href={file.url}
                          download={file.name}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200"
                          target="_blank">
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Remove Button (Only in edit mode) */}
                        {currentMode === "edit" && (
                          <button
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* -------------------------------- */}

            {currentMode === "view" && todoToEdit && (
              <ListCommentComponent
                listCommentData={commentList}
                todoData={todoToEdit}
                onCommentChange={handleCommentChange}
              />
            )}
          </div>
        </div>

        {currentMode === "view" && todoToEdit ? (
          <CommentFormComponent
            data={todoToEdit}
            todoData={todoToEdit}
            onDataChange={handleCommentChange}
          />
        ) : (
          <div className="border-t px-6 py-4 flex-shrink-0">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseDrawer}
                disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSaveTodo} disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Render Dialog */}
      {todoToEdit && isAttachDialogOpen && currentMode === "edit" && (
        <AttachFileDialog
          open={isAttachDialogOpen}
          onOpenChange={setIsAttachDialogOpen}
          projectId={projectId}
          userId={user?._id || ""}
          onAttach={handleAddAttachments}
        />
      )}
    </Sheet>
  );
}

const PriorityDot = ({ priority }: { priority: IPriority | null }) => {
  if (!priority) return null;

  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: priority.color }}
    />
  );
};

interface FieldProps {
  label: string;
  value?: string | string[];
  children?: React.ReactNode;
}

const ViewField = ({ label, value }: FieldProps) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="text-sm text-foreground min-h-[20px]">
      {Array.isArray(value)
        ? value.join(", ")
        : value || <span className="italic text-muted-foreground">—</span>}
    </div>
  </div>
);

const formatDateTime = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
