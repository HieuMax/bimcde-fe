import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, Search, ChevronDown, Check, Plus, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"

type GroupByType = "none" | "status" | "assignee" | "priority"

export function ClashSets() {

    const queryClient = useQueryClient()

    // --- STATE ---
    const [closedExpanded, setClosedExpanded] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"date-created" | "name" | "date-modified">("date-created")

    // State Group By
    const [groupBy, setGroupBy] = useState<GroupByType>("none")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // State Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    //   const [todoToEdit, setTodoToEdit] = useState<ITodo | null>(null)
    const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view")
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

    // --- QUERIES ---
    //   const { data: todos = [], isLoading } = useQuery({
    //     queryKey: ["todos", projectId, statusFilter],
    //     queryFn: () => todoService.getAll(projectId, statusFilter ? { status: statusFilter } : undefined),
    //     enabled: !!projectId,
    //   })

    return (
        <aside className="w-full bg-background flex flex-col min-h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Clash sets</h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"
                        // onClick={handleCreateNew}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortBy("date-created")}>Date created {sortBy === "date-created" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("name")}>Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("date-modified")}>Date modified {sortBy === "date-modified" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {showSearch && (
                    <div className="mb-3">
                        <Input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-sm" />
                    </div>
                )}
                <div className="w-fit">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">{statusFilter || "From all models"}<ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>From all models</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("Shared with me")}>Shared with me</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("From visible models")}>From visible models</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Group By Filter */}
            <div className="px-4 py-2 border-b border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground">
                            Group by: {groupBy === "none" ? "No grouping" : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                            <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setGroupBy("none")}>No grouping {groupBy === "none" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGroupBy("status")}>Status {groupBy === "status" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGroupBy("assignee")}>Assignee {groupBy === "assignee" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGroupBy("priority")}>Priority {groupBy === "priority" && <Check className="ml-2 h-4 w-4" />}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* View List Area */}
            <div className="flex flex-col overflow-y-auto bg-muted/10">

            </div>
        </aside>
    )
}