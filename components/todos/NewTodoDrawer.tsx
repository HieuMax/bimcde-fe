"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { todoService } from "@/services/todo.service"

interface NewTodoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function NewTodoDrawer({ open, onOpenChange, projectId }: NewTodoDrawerProps) {
  const queryClient = useQueryClient()
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "normal" as "high" | "normal" | "low",
    completion: 0,
    assignees: "",
    type: "undefined" as "undefined" | "comment" | "issue" | "request" | "fault" | "inquiry" | "solution" | "remark" | "clash",
    tags: "",
  })

  const createMutation = useMutation({
    mutationFn: todoService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      toast.success("Todo created successfully")
      onOpenChange(false)
      // Reset form
      setNewTodo({
        title: "",
        description: "",
        dueDate: "",
        priority: "normal",
        completion: 0,
        assignees: "",
        type: "undefined",
        tags: "",
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error?.response?.data?.message || error.message || "Failed to create todo"
      toast.error(msg)
    },
  })

  const handleSaveTodo = () => {
    if (!newTodo.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!projectId) {
      toast.error("Project ID is required")
      return
    }

    // Parse assignees and tags from comma-separated strings
    const assigneesArray = newTodo.assignees
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0)

    const tagsArray = newTodo.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    createMutation.mutate({
      title: newTodo.title.trim(),
      description: newTodo.description.trim() || undefined,
      dueDate: newTodo.dueDate || undefined,
      priority: newTodo.priority,
      completion: newTodo.completion,
      assignees: assigneesArray.length > 0 ? assigneesArray : undefined,
      type: newTodo.type,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      projectId,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="border-b px-6 py-4 flex-shrink-0">
          <SheetTitle className="text-lg font-semibold">New ToDo</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm text-muted-foreground">
                Title (required)
              </Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm text-muted-foreground">
                Description (required)
              </Label>
              <Textarea
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="min-h-[80px] resize-none w-full"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="dueDate" className="text-sm text-muted-foreground">
                  Due date
                </Label>
                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center cursor-pointer">
                  <span className="text-[10px] text-muted-foreground">?</span>
                </div>
              </div>
              <div className="relative w-full">
                <Input
                  id="dueDate"
                  type="date"
                  placeholder="MMM DD, YYYY"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                  className="w-full pr-10 cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm text-muted-foreground">
                Priority
              </Label>
              <Select
                value={newTodo.priority}
                onValueChange={(value) =>
                  setNewTodo({ ...newTodo, priority: value as "high" | "normal" | "low" })
                }
              >
                <SelectTrigger id="priority" className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="low" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Completion % */}
            <div className="space-y-2">
              <Label htmlFor="completion" className="text-sm text-muted-foreground">
                Completion %
              </Label>
              <Input
                id="completion"
                type="number"
                min="0"
                max="100"
                value={newTodo.completion}
                onChange={(e) => setNewTodo({ ...newTodo, completion: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <Label htmlFor="assignees" className="text-sm text-muted-foreground">
                Assignees (0)
              </Label>
              <Input
                id="assignees"
                placeholder="Add people or groups"
                value={newTodo.assignees}
                onChange={(e) => setNewTodo({ ...newTodo, assignees: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm text-muted-foreground">
                Type
              </Label>
              <Select
                value={newTodo.type}
                onValueChange={(value) =>
                  setNewTodo({
                    ...newTodo,
                    type: value as
                      | "undefined"
                      | "comment"
                      | "issue"
                      | "request"
                      | "fault"
                      | "inquiry"
                      | "solution"
                      | "remark"
                      | "clash",
                  })
                }
              >
                <SelectTrigger id="type" className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined" className="cursor-pointer">
                    Undefined
                  </SelectItem>
                  <SelectItem value="comment" className="cursor-pointer">
                    Comment
                  </SelectItem>
                  <SelectItem value="issue" className="cursor-pointer">
                    Issue
                  </SelectItem>
                  <SelectItem value="request" className="cursor-pointer">
                    Request
                  </SelectItem>
                  <SelectItem value="fault" className="cursor-pointer">
                    Fault
                  </SelectItem>
                  <SelectItem value="inquiry" className="cursor-pointer">
                    Inquiry
                  </SelectItem>
                  <SelectItem value="solution" className="cursor-pointer">
                    Solution
                  </SelectItem>
                  <SelectItem value="remark" className="cursor-pointer">
                    Remark
                  </SelectItem>
                  <SelectItem value="clash" className="cursor-pointer">
                    Clash
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm text-muted-foreground">
                Tags (0)
              </Label>
              <Input
                id="tags"
                placeholder="Add tags"
                value={newTodo.tags}
                onChange={(e) => setNewTodo({ ...newTodo, tags: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTodo} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
