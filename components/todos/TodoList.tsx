"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  MoreVertical,
  ChevronDown,
  Check,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { todoService } from "@/services/todo3d.service";
import { ITodo } from "@/types/todo3d";

interface TodoListProps {
  projectId: string;
  onRestoreView?: (viewState: any) => void;
  onSelectTodo?: (todo: ITodo) => void;
  onOpenDrawer: (todo: ITodo | null, mode: "view" | "edit" | "create") => void;
}

type GroupByType = "none" | "status" | "assignee" | "priority";

export function ToDo({
  projectId,
  onSelectTodo,
  onRestoreView,
  onOpenDrawer,
}: TodoListProps) {
  const queryClient = useQueryClient();

  // --- STATE ---
  const [closedExpanded, setClosedExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-created" | "name" | "date-modified" | "priority" | "status"
  >("date-created");

  // State Group By
  const [groupBy, setGroupBy] = useState<GroupByType>("none");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // State Drawer
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  // const [todoToEdit, setTodoToEdit] = useState<ITodo | null>(null)
  // const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // --- QUERIES ---
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", projectId, statusFilter],
    queryFn: () =>
      todoService.getAll(
        projectId,
        statusFilter ? { status: statusFilter } : undefined,
      ),
    enabled: !!projectId,
  });
  console.log(todos);
  // --- MUTATIONS ---
  const deleteMutation = useMutation({
    mutationFn: todoService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      toast.success("Todo deleted successfully");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete todo";
      toast.error(msg);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "New" | "In Progress" | "Done" | "Closed";
    }) => todoService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      toast.success("Status updated successfully");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update status";
      toast.error(msg);
    },
  });

  // --- HANDLERS ---
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this todo?"))
      deleteMutation.mutate(id);
  };

  const handleStatusChange = (
    id: string,
    newStatus: "New" | "In Progress" | "Done" | "Closed",
  ) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // const handleEdit = (todo: ITodo) => {
  //   setTodoToEdit(todo)
  //   setDrawerMode("edit")
  //   setIsDrawerOpen(true)
  // }

  const handleCreateNew = () => {
    onOpenDrawer(null, "create");
  };

  const handleView = (todo: ITodo) => {
    onOpenDrawer(todo, "view");
    // setTodoToEdit(todo)
    // setDrawerMode("view")
    // setIsDrawerOpen(true)

    // if (onSelectTodo) {
    //   onSelectTodo(todo);
    // }
  };

  // --- DATA PROCESSING ---
  const activeTodos = todos.filter((todo) => todo.status !== "Closed");
  const closedTodos = todos.filter((todo) => todo.status === "Closed");

  const filteredTodos = useMemo(() => {
    let result = statusFilter ? todos : activeTodos;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((todo) => {
        // const todoId = todo._id || ""
        const title = todo.title || "";
        // const assignees = todo.assignees?.join(", ") || "Unassigned"
        return (
          // todoId.toLowerCase().includes(query) ||
          title.toLowerCase().includes(query)
          // assignees.toLowerCase().includes(query)
        );
      });
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "name":
          return a.title.localeCompare(b.title);
        case "date-modified":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "priority":
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return (
            priorityOrder[b.priority?.name as keyof typeof priorityOrder] -
            priorityOrder[a.priority?.name as keyof typeof priorityOrder]
          );
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [todos, activeTodos, searchQuery, sortBy, statusFilter]);

  const groupedData = useMemo(() => {
    if (groupBy === "none") return null;

    const groups: Record<string, ITodo[]> = {};

    filteredTodos.forEach((todo) => {
      let key = "Other";

      if (groupBy === "status") {
        key = todo.status || "New";
      } else if (groupBy === "priority") {
        key = todo.priority?.name || "normal";
      } else if (groupBy === "assignee") {
        key =
          todo.assignees && todo.assignees.length > 0
            ? todo.assignees.map((a) => a.name).join(", ")
            : "Unassigned";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(todo);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === "priority") {
        const order = { high: 1, normal: 2, low: 3 };
        return (
          (order[a as keyof typeof order] || 99) -
          (order[b as keyof typeof order] || 99)
        );
      }
      if (groupBy === "status") {
        const order = { New: 1, "In Progress": 2, Done: 3, Closed: 4 };
        return (
          (order[a as keyof typeof order] || 99) -
          (order[b as keyof typeof order] || 99)
        );
      }
      return a.localeCompare(b);
    });

    return { groups, sortedKeys };
  }, [filteredTodos, groupBy]);

  useEffect(() => {
    if (groupedData) {
      const newExpandedState: Record<string, boolean> = {};
      groupedData.sortedKeys.forEach((key) => {
        newExpandedState[key] = true;
      });
      setExpandedGroups(newExpandedState);
    }
  }, [groupBy, groupedData?.sortedKeys.length]); // eslint-disable-line

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // --- HELPER FUNCTIONS ---
  const formatAssignment = (todo: ITodo) => {
    if (!todo.assignees?.length) return "Unassigned";
    return `Assigned to ${todo.assignees.map((a) => a.name).join(", ")}`;
  };
  const getTodoDisplayId = (todo: ITodo) =>
    todo._id.substring(0, 8).toUpperCase();

  const renderTodoRow = (todo: ITodo) => (
    <div
      key={todo._id}
      className="px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors group cursor-pointer bg-background"
      onClick={() => handleView(todo)}>
      <div className="flex items-start gap-3">
        <div
          className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${todo.priority?.name === "high"
              ? "bg-destructive"
              : todo.priority?.name === "low"
                ? "bg-gray-400"
                : "bg-blue-500"
            }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                {getTodoDisplayId(todo)}
              </p>
              <p className="text-sm font-medium mb-1 break-words">
                {todo.title}
              </p>
              <p className="text-xs text-muted-foreground mb-0.5">
                {todo.status}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAssignment(todo)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(todo);
                  }}>
                  Edit
                </DropdownMenuItem>
                {todo.status !== "New" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(todo._id, "New");
                    }}>
                    Change to New
                  </DropdownMenuItem>
                )}
                {todo.status !== "In Progress" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(todo._id, "In Progress");
                    }}>
                    Change to In Progress
                  </DropdownMenuItem>
                )}
                {todo.status !== "Done" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(todo._id, "Done");
                    }}>
                    Change to Done
                  </DropdownMenuItem>
                )}
                {todo.status !== "Closed" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(todo._id, "Closed");
                    }}>
                    Close
                  </DropdownMenuItem>
                )}
                {/* Delete moved to detail drawer */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="w-full bg-background flex flex-col min-h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">ToDos</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("date-created")}>
                  Date created{" "}
                  {sortBy === "date-created" && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priority")}>
                  Priority{" "}
                  {sortBy === "priority" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="mb-3">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-8 px-2 text-sm font-normal">
              {statusFilter || "All ToDos"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("New")}>
              New
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("In Progress")}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("Done")}>
              Done
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Group By Filter */}
      <div className="px-4 py-2 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground">
              Group by:{" "}
              {groupBy === "none"
                ? "No grouping"
                : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setGroupBy("none")}>
              No grouping{" "}
              {groupBy === "none" && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("status")}>
              Status{" "}
              {groupBy === "status" && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
              Assignee{" "}
              {groupBy === "assignee" && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("priority")}>
              Priority{" "}
              {groupBy === "priority" && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Todo List Area */}
      <div className="flex flex-col overflow-y-auto bg-muted/10">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading todos...
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery
              ? "No todos found matching your search"
              : "No todos found"}
          </div>
        ) : groupBy === "none" ? (
          filteredTodos.map(renderTodoRow)
        ) : (
          // RENDER GROUPED
          groupedData?.sortedKeys.map((groupName) => {
            const todosInGroup = groupedData.groups[groupName] || [];
            const isExpanded = expandedGroups[groupName];

            return (
              <div key={groupName} className="mb-2">
                {/* Group Header */}
                <div
                  className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors select-none sticky top-0 bg-background/95 backdrop-blur z-10 border-y border-border"
                  onClick={() => toggleGroup(groupName)}>
                  <div
                    className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-sm capitalize">
                    {groupName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">
                    {todosInGroup.length}
                  </span>
                </div>

                {/* Group Content */}
                {isExpanded && (
                  <div className="border-b border-border">
                    {todosInGroup.map(renderTodoRow)}
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="border-t border-border bg-background sticky bottom-0">
          <button
            onClick={() => setClosedExpanded(!closedExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-sm">
            <span className="font-medium">Closed ({closedTodos.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${closedExpanded ? "rotate-180" : ""}`}
            />
          </button>
          {closedExpanded && (
            <div className="px-4 py-3 bg-muted/20">
              {closedTodos.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No closed tasks
                </div>
              ) : (
                closedTodos.map(renderTodoRow)
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function TodoList(props: TodoListProps) {
  return <ToDo {...props} />;
}
