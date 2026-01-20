"use client"

import { useState, useEffect } from "react"
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
import { Calendar, MoveLeft } from "lucide-react"
import { todoService } from "@/services/todo.service"
import { ITodo } from "@/types/todo"
import { useRef } from "react";
import { Pencil } from "lucide-react"
interface NewTodoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  todoToEdit?: ITodo | null
  mode: "view" | "edit" | "create"
}


export function NewTodoDrawer({ open, onOpenChange, projectId, todoToEdit, mode }: NewTodoDrawerProps) {
  const queryClient = useQueryClient()

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
        })
      } else {
        // Reset to default if creating new
        setFormData(defaultState)
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

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      priority: formData.priority,
      completion: formData.completion,
      assignees: assigneesArray.length > 0 ? assigneesArray : undefined,
      type: formData.type,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      projectId,
    }

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

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={open} onOpenChange={handleCloseDrawer}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">

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
  value?: string
  children?: React.ReactNode
}

const ViewField = ({ label, value }: FieldProps) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="text-sm text-foreground min-h-[20px]">
      {value || <span className="italic text-muted-foreground">—</span>}
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