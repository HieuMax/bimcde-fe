"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CheckSquare, Menu, Search, MoreVertical, ChevronDown, Check, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NewTodoDrawer } from "./NewTodoDrawer"
import { todoService } from "@/services/todo.service"
import { ITodo } from "@/types/todo"

interface TodoListProps {
  projectId: string
}

export function ToDo({ projectId }: TodoListProps) {
  const queryClient = useQueryClient()

  const [closedExpanded, setClosedExpanded] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date-created" | "name" | "date-modified" | "priority" | "status">(
    "date-created",
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // Fetch todos
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", projectId, statusFilter],
    queryFn: () => todoService.getAll(projectId, statusFilter ? { status: statusFilter } : undefined),
    enabled: !!projectId,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: todoService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      toast.success("Todo deleted successfully")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error?.response?.data?.message || error.message || "Failed to delete todo"
      toast.error(msg)
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "New" | "In Progress" | "Done" | "Closed" }) =>
      todoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] })
      toast.success("Status updated successfully")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg = error?.response?.data?.message || error.message || "Failed to update status"
      toast.error(msg)
    },
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this todo?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleStatusChange = (id: string, newStatus: "New" | "In Progress" | "Done" | "Closed") => {
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  // Separate active and closed todos
  const activeTodos = todos.filter((todo) => todo.status !== "Closed")
  const closedTodos = todos.filter((todo) => todo.status === "Closed")

  const filteredTodos = useMemo(() => {
    let result = statusFilter ? todos : activeTodos

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((todo) => {
        const todoId = todo._id || ""
        const title = todo.title || ""
        const assignees = todo.assignees?.join(", ") || "Unassigned"
        return (
          todoId.toLowerCase().includes(query) ||
          title.toLowerCase().includes(query) ||
          assignees.toLowerCase().includes(query)
        )
      })
    }

    // Sort todos
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "name":
          return a.title.localeCompare(b.title)
        case "date-modified":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "priority":
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
  }, [todos, activeTodos, searchQuery, sortBy, statusFilter])

  const formatAssignment = (todo: ITodo): string => {
    if (!todo.assignees || todo.assignees.length === 0) {
      return "Unassigned"
    }
    return `Assigned to ${todo.assignees.join(", ")}`
  }

  const getTodoDisplayId = (todo: ITodo): string => {
    // Use first 8 characters of _id as display ID, or generate a short code
    return todo._id.substring(0, 8).toUpperCase()
  }

  return (
    <aside className="w-full bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">ToDos</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {/* </CHANGE> */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <CheckSquare className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortBy("date-created")}>
                  <span className="flex-1">Date created</span>
                  {sortBy === "date-created" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortBy("name")}>
                  <span className="flex-1">Name</span>
                  {sortBy === "name" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortBy("date-modified")}>
                  <span className="flex-1">Date modified</span>
                  {sortBy === "date-modified" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortBy("priority")}>
                  <span className="flex-1">Priority</span>
                  {sortBy === "priority" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortBy("status")}>
                  <span className="flex-1">Status</span>
                  {sortBy === "status" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showSearch && (
          <div className="mb-3">
            <Input
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">
              {statusFilter === undefined ? "All ToDos in project" : statusFilter === "New" ? "New ToDos" : statusFilter === "In Progress" ? "In Progress" : statusFilter}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>All ToDos in project</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("New")}>New</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("In Progress")}>In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("Done")}>Done</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Group By Filter */}
      <div className="px-4 py-2 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground"
            >
              Group by: No grouping
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>No grouping</DropdownMenuItem>
            <DropdownMenuItem>Status</DropdownMenuItem>
            <DropdownMenuItem>Assignee</DropdownMenuItem>
            <DropdownMenuItem>Priority</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading todos...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No todos found matching your search" : "No todos found"}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo._id}
              className="px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
                    todo.priority === "high" ? "bg-destructive" : todo.priority === "low" ? "bg-gray-400" : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{getTodoDisplayId(todo)}</p>
                      <p className="text-sm font-medium mb-1 break-words">{todo.title}</p>
                      <p className="text-xs text-muted-foreground mb-0.5">{todo.status}</p>
                      <p className="text-xs text-muted-foreground">{formatAssignment(todo)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        {todo.status !== "New" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(todo._id, "New")}>
                            Change to New
                          </DropdownMenuItem>
                        )}
                        {todo.status !== "In Progress" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(todo._id, "In Progress")}>
                            Change to In Progress
                          </DropdownMenuItem>
                        )}
                        {todo.status !== "Done" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(todo._id, "Done")}>
                            Change to Done
                          </DropdownMenuItem>
                        )}
                        {todo.status !== "Closed" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(todo._id, "Closed")}>
                            Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(todo._id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Closed Section */}
      <div className="border-t border-border">
        <button
          onClick={() => setClosedExpanded(!closedExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-sm"
        >
          <span className="font-medium">Closed ({closedTodos.length})</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${closedExpanded ? "rotate-180" : ""}`} />
        </button>
        {closedExpanded && (
          <div className="px-4 py-3">
            {closedTodos.length === 0 ? (
              <div className="text-sm text-muted-foreground">No closed tasks</div>
            ) : (
              closedTodos.map((todo) => (
                <div
                  key={todo._id}
                  className="px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${
                        todo.priority === "high"
                          ? "bg-destructive"
                          : todo.priority === "low"
                            ? "bg-gray-400"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{getTodoDisplayId(todo)}</p>
                      <p className="text-sm font-medium mb-1 break-words">{todo.title}</p>
                      <p className="text-xs text-muted-foreground">{formatAssignment(todo)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <NewTodoDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} projectId={projectId} />
    </aside>
  )
}

export default function TodoList(props: TodoListProps) {
  return <ToDo {...props} />
}
