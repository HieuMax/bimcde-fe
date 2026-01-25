"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { MoreVertical, Trash2, Camera, Pencil, Eye, Plus, RefreshCw, Search, Menu, Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { viewService } from "@/services/view.service"
import { IView } from "@/types/view"
import { Input } from "@/components/ui/input"

interface ViewListProps {
    projectId: string
    ifcUrls?: string[] // filter "In these models"
    currentUserId?: string // filter "Created by me"
    currentUserEmail?: string // filter "Shared with me"
    onOpenDrawer: (view: IView | null, mode: "view" | "edit" | "create") => void
    onRestoreView: (view: IView) => void
    onUpdateSnapshot: (view: IView) => void
}

type FilterType = "all" | "my-views" | "shared" | "current-context";
type SortType = "date-created" | "name" | "date-modified";

export function ViewList({
    projectId,
    ifcUrls = [],
    currentUserId,
    currentUserEmail,
    onOpenDrawer,
    onRestoreView,
    onUpdateSnapshot
}: ViewListProps) {
    const queryClient = useQueryClient()

    // --- STATES ---
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<SortType>("date-created")
    const [filterType, setFilterType] = useState<FilterType>("all")

    // --- QUERY ---
    const { data: views = [], isLoading } = useQuery({
        queryKey: ["views", projectId],
        queryFn: () => viewService.getAll(projectId)
    })

    // --- MUTATION ---
    const deleteMutation = useMutation({
        mutationFn: (id: string) => viewService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["views", projectId] })
            toast.success("View deleted")
        }
    })

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this view?")) {
            deleteMutation.mutate(id)
        }
    }

    // --- FILTER & SORT LOGIC ---
    const filteredViews = useMemo(() => {
        let result = [...views];

        // 1. Filter by Type
        if (filterType === "my-views" && currentUserId) {
            result = result.filter(v => {
                const creatorId = typeof v.createdBy === 'string' ? v.createdBy : v.createdBy?._id;
                return creatorId === currentUserId;
            });
        } else if (filterType === "shared" && currentUserEmail) {
            result = result.filter(v => v.shareWith?.includes(currentUserEmail));
        } else if (filterType === "current-context") {
            result = result.filter(v => {
                if (!v.items || v.items.length === 0) return false;
                return v.items.some(item => ifcUrls.includes(item.fileUrl));
            });
        }

        // 2. Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(v => v.title.toLowerCase().includes(query));
        }

        // 3. Sort
        return result.sort((a, b) => {
            switch (sortBy) {
                case "date-created":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "date-modified":
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case "name":
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
    }, [views, filterType, searchQuery, sortBy, ifcUrls, currentUserId, currentUserEmail]);


    // Handle Create New
    const handleCreateNew = () => {
        onOpenDrawer(null, "create");
    }

    // Label Helper
    const getFilterLabel = () => {
        switch (filterType) {
            case "all": return "All views";
            case "my-views": return "Created by me";
            case "shared": return "Shared with me";
            case "current-context": return "In these models";
            default: return "All views";
        }
    }

    if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading views...</div>

    return (
        <aside className="w-full bg-background flex flex-col min-h-full">
            {/* --- HEADER --- */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Views</h2>
                    <div className="flex items-center gap-1">
                        {/* Create Button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={handleCreateNew} title="Create View">
                            <Plus className="h-4 w-4" />
                        </Button>

                        {/* Sort Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortBy("date-created")}>
                                    Date created {sortBy === "date-created" && <Check className="ml-2 h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("name")}>
                                    Name {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("date-modified")}>
                                    Date modified {sortBy === "date-modified" && <Check className="ml-2 h-4 w-4" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Toggle Search */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search Input */}
                {showSearch && (
                    <div className="mb-3">
                        <Input
                            type="text"
                            placeholder="Search views..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                )}

                {/* Context Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm font-normal">
                            {getFilterLabel()}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                        <DropdownMenuItem onClick={() => setFilterType("all")}>
                            All views {filterType === "all" && <Check className="ml-2 h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType("my-views")}>
                            Created by me {filterType === "my-views" && <Check className="ml-2 h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType("shared")}>
                            Shared with me {filterType === "shared" && <Check className="ml-2 h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType("current-context")}>
                            In these models {filterType === "current-context" && <Check className="ml-2 h-4 w-4" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* --- LIST CONTAINER --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {filteredViews.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm mt-10">
                        {searchQuery ? "No views match your search." : "No views found."}
                    </div>
                ) : (
                    filteredViews.map((view) => (
                        <div
                            key={view._id}
                            className="group relative border rounded-lg overflow-hidden bg-background hover:shadow-md transition-all flex flex-col"
                        >
                            {/* Thumbnail Image */}
                            <div
                                className="aspect-video w-full bg-slate-100 cursor-pointer relative overflow-hidden"
                                onClick={() => onRestoreView(view)}
                            >
                                {view.viewState?.thumbnail ? (
                                    <img
                                        src={view.viewState.thumbnail}
                                        alt={view.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                )}

                                {/* Overlay Hint */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                                        <Eye className="w-3 h-3" /> Apply View
                                    </div>
                                </div>
                            </div>

                            {/* Content & Actions */}
                            <div className="p-3 flex items-start justify-between gap-2 border-t">
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => onOpenDrawer(view, "view")}
                                >
                                    <h3 className="font-medium text-sm truncate text-foreground" title={view.title}>
                                        {view.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>{new Date(view.createdAt).toLocaleDateString()}</span>
                                        {/* Optional: Show creator name if needed */}
                                        {/* <span>• {typeof view.createdBy === 'object' ? view.createdBy.fullName : ''}</span> */}
                                    </div>
                                </div>

                                {/* Action Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onOpenDrawer(view, "edit")}>
                                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Info
                                        </DropdownMenuItem>

                                        <DropdownMenuItem onClick={() => onUpdateSnapshot(view)}>
                                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Update Snapshot
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(view._id)}>
                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    )
}