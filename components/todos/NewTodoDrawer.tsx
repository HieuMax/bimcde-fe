"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AxiosError } from "axios"
import "./todoDrawer.css"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar, Eye, LinkIcon, MoveLeft, Plus, Trash2,
  Paperclip, Download, X, File as FileIcon,
  Pencil
} from "lucide-react"
import { todoService } from "@/services/todo3d.service"
import { ITodo } from "@/types/todo3d"

import { AttachFileDialog } from "./AttachFileDialog";
import { useAuth } from "@/app/context/authContext";

interface NewTodoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestoreView?: (viewState: any) => void
  projectId: string
  todoToEdit?: ITodo | null
  mode: "view" | "edit" | "create"
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
}

// Helper format size
const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function NewTodoDrawer({ open, onOpenChange, onRestoreView, projectId, todoToEdit, mode, initialData,
  currentSelection = [],
}: NewTodoDrawerProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth();

  // State Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);

  // Initial state helper
  const defaultState = {
    title: "",
    description: "",
    dueDate: "",
    priority: "normal" as "high" | "normal" | "low",
    completion: 0,
    assignees: "",
    type: "undefined" as "undefined" | "comment" | "issue" | "request" | "fault" | "inquiry" | "solution" | "remark" | "clash",
    tags: "",
    items: [] as { fileUrl: string; modelId: string; expressId: string[] }[],
    viewState: null as any,
  }

  const [currentMode, setCurrentMode] = useState(mode)

  useEffect(() => {
    if (open) {
      setCurrentMode(mode)
    }
  }, [mode, open])

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString() : ""
  const [formData, setFormData] = useState(defaultState)
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Helper
  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
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
        let formattedDate = ""
        if (todoToEdit.dueDate) {
          const d = new Date(todoToEdit.dueDate)
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0]
          }
        }
        setFormData({
          title: todoToEdit.title || "",
          description: todoToEdit.description || "",
          dueDate: formattedDate,
          priority: (todoToEdit.priority as any) || "normal",
          completion: todoToEdit.completion || 0,
          // Convert arrays to comma-separated strings for the inputs
          assignees: todoToEdit.assignees?.join(", ") || "",
          type: (todoToEdit.type as any) || "undefined",
          tags: todoToEdit.tags?.join(", ") || "",
          items: todoToEdit?.items || [],
          viewState: todoToEdit?.viewState || null,
        })
        setAttachments(todoToEdit.attachments || []);
      } else if (initialData && mode === 'create') {
        setFormData({
          ...defaultState,
          items: initialData?.items || [],
          viewState: initialData?.viewState || null,
        })
        setAttachments([]);
      } else {
        // Reset to default if creating new
        setFormData(defaultState)
        setAttachments([]);
      }
    }
  }, [open, todoToEdit])

  const createMutation = useMutation({
    mutationFn: todoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      toast.success("Todo created successfully")
      handleCloseDrawer()
      setFormData(defaultState)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error?.response?.data?.message || error.message || "Failed to create todo"
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => todoService.update(todoToEdit!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      toast.success("Todo updated successfully")
      handleCloseDrawer()
      setFormData(defaultState)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error?.response?.data?.message || error.message || "Failed to update todo"
      toast.error(msg)
    },
  })

  const handleSaveTodo = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    // Parse assignees and tags
    const assigneesArray = formData.assignees
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      priority: formData.priority,
      completion: formData.completion,
      assignees: assigneesArray.length > 0 ? assigneesArray : undefined,
      type: formData.type,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      projectId,
      viewState: formData.viewState || undefined,
      items: formData.items || [],
      attachments: attachments,
    }

    console.log(payload)

    if (todoToEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleCloseDrawer = () => {
    onOpenChange(false)

    setTimeout(() => {
      setCurrentMode("view")
    }, 100)
  }

  const handleAddAttachments = (newFiles: any[]) => {
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // --- LOGIC CONTROL LINKED ITEMS ---

  const handleRemoveLink = (fileUrl: string, idToRemove: string) => {
    setFormData(prev => {
      const newItems = prev.items?.map(group => {
        if (group.fileUrl === fileUrl) {
          return {
            ...group,
            expressId: group.expressId.filter(id => id !== idToRemove)
          };
        }
        return group;
      }).filter(group => group.expressId.length > 0) || [];

      return { ...prev, items: newItems };
    });
  };

  const handleUnlinkAll = () => {
    setFormData(prev => ({ ...prev, items: [] }));
  };

  const handleAddSelection = () => {
    console.log("Current Selection:", currentSelection);
    if (!currentSelection || currentSelection.length === 0) {
      toast.error("Please select objects in the 3D Viewer first.");
      return;
    }

    setFormData(prev => {
      const currentItems = [...(prev.items || [])];

      currentSelection.forEach(sel => {
        const fileUrl = sel.fileUrl;
        const expressId = String(sel.expressID);

        const existingGroup = currentItems.find(g => g.fileUrl === fileUrl);

        if (existingGroup) {
          if (!existingGroup.expressId.includes(expressId)) {
            existingGroup.expressId.push(expressId);
          }
        } else {
          currentItems.push({
            fileUrl: fileUrl,
            modelId: String(sel.modelID),
            expressId: [expressId]
          });
        }
      });

      return { ...prev, items: currentItems };
    });

    toast.success(`Linked ${currentSelection.length} objects to this Todo.`);
  };

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={open} onOpenChange={handleCloseDrawer} modal={false}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}

        style={{
          boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
          pointerEvents: "auto",
          zIndex: 50
        }}
      >

        <SheetHeader className="border-b px-6 py-4 flex items-center">
          <div className="flex items-center gap-2 justify-start w-full">
            {currentMode === "edit" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMode("view")}
              >
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
                onClick={() => setCurrentMode("edit")}
              >
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
                }}
              >
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
                <Label htmlFor="title" className="text-sm text-muted-foreground">
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
                <Label className="text-sm text-muted-foreground">Description</Label>
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
              <div className="space-y-2"
                onClick={() => {
                  dateInputRef.current?.showPicker();
                }}>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dueDate" className="text-sm text-muted-foreground">Due date</Label>
                </div>
                <div className="relative w-full">
                  <Input
                    ref={dateInputRef}
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full pr-10 cursor-pointer"
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Priority */}
            {currentMode === "view" ? (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <div className="flex items-center gap-2 text-sm">
                  <PriorityDot priority={formData.priority} />
                  <span className="capitalize">{formData.priority}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm text-muted-foreground">
                  Priority
                </Label>

                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as any })
                  }
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue>
                      {formData.priority && (
                        <div className="flex items-center gap-2">
                          <PriorityDot priority={formData.priority} />
                          <span className="capitalize">{formData.priority}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority="normal" />
                        <span>Normal</span>
                      </div>
                    </SelectItem>

                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority="high" />
                        <span>High</span>
                      </div>
                    </SelectItem>

                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority="low" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Completion */}
            {currentMode === "view" ? (
              <ViewField
                label="Completion"
                value={`${formData.completion}%`}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="completion" className="text-sm text-muted-foreground">Completion %</Label>
                <Input
                  id="completion"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completion}
                  onChange={(e) => setFormData({ ...formData, completion: Number(e.target.value) })}
                />
              </div>
            )}


            {/* Assignees */}
            {currentMode === "view" ? (
              <ViewField
                label="Assignees"
                value={formData.assignees || "Unassigned"}
              />
            ) : (
              <Input
                value={formData.assignees}
                onChange={(e) =>
                  setFormData({ ...formData, assignees: e.target.value })
                }
              />
            )}


            {/* Type */}
            {currentMode === "view" ? (
              <ViewField
                label="Type"
                value={formData.type || "undefined"}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm text-muted-foreground">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undefined">Undefined</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="fault">Fault</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="solution">Solution</SelectItem>
                    <SelectItem value="remark">Remark</SelectItem>
                    <SelectItem value="clash">Clash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}


            {/* Tags */}
            {currentMode === "view" ? (
              <ViewField
                label="Tags"
                value={formData.tags || ""}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm text-muted-foreground">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Comma separated tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            )}

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
                    {formData.items?.reduce((acc, g) => acc + g.expressId.length, 0) || 0}
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
                      disabled={!formData.items?.length}
                    >
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={handleAddSelection}
                    >
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
                    <div className="text-xs font-semibold text-slate-700 mb-1 truncate" title={group.fileUrl}>
                      File: {getFileName(group.fileUrl)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.expressId.map((id) => (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-white border rounded px-1.5 py-0.5 text-xs text-slate-600 shadow-sm group/tag"
                        >
                          <span>#{id}</span>
                          {currentMode !== "view" && (
                            <button
                              onClick={() => handleRemoveLink(group.fileUrl, id)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                            >
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
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                  <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full">
                    {attachments.length}
                  </span>
                </h3>

                {currentMode !== "view" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={() => setIsAttachDialogOpen(true)}
                  >
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
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md border bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">
                        <FileIcon className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-700 truncate hover:underline"
                        >
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
                        target="_blank"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {/* Remove Button (Only in edit/create mode) */}
                      {currentMode !== "view" && (
                        <button
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* -------------------------------- */}

          </div>
        </div>

        <div className="border-t px-6 py-4 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCloseDrawer} disabled={isPending}>
              Cancel
            </Button>
            {currentMode !== "view" && (
              <Button onClick={handleSaveTodo} disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            )}

          </div>
        </div>
      </SheetContent>

      {/* Render Dialog */}
      {isAttachDialogOpen && (
        <AttachFileDialog
          open={isAttachDialogOpen}
          onOpenChange={setIsAttachDialogOpen}
          projectId={projectId}
          userId={user?._id || ""}
          onAttach={handleAddAttachments}
        />
      )}
    </Sheet>
  )
}

const PriorityDot = ({ priority }: { priority: "high" | "normal" | "low" }) => (
  <div
    className={`w-3 h-3 rounded-full ${priority === "high"
      ? "bg-destructive"
      : priority === "low"
        ? "bg-gray-400"
        : "bg-blue-500"
      }`}
  />
);

interface FieldProps {
  label: string
  value?: string | string[]
  children?: React.ReactNode
}

const ViewField = ({ label, value }: FieldProps) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="text-sm text-foreground min-h-[20px]">
      {Array.isArray(value) ? value.join(', ') : value || <span className="italic text-muted-foreground">—</span>}
    </div>
  </div>
)

const formatDateTime = (date?: string) => {
  if (!date) return ""
  return new Date(date).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}