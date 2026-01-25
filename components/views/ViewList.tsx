"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { MoreVertical, Trash2, Camera, Pencil, Eye, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { viewService } from "@/services/view.service"
import { IView } from "@/types/view"

interface ViewListProps {
    projectId: string
    onOpenDrawer: (view: IView | null, mode: "view" | "edit" | "create") => void
    onRestoreView: (view: IView) => void
    onUpdateSnapshot: (view: IView) => void
}

export function ViewList({ projectId, onOpenDrawer, onRestoreView, onUpdateSnapshot }: ViewListProps) {
    const queryClient = useQueryClient()

    // 1. Fetch danh sách View
    const { data: views, isLoading } = useQuery({
        queryKey: ["views", projectId],
        queryFn: () => viewService.getAll(projectId)
    })

    // 2. Xóa View
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

    // Handle tạo mới
    const handleCreateNew = () => {
        // mode 'create', view null -> ViewerClient sẽ tự capture và mở drawer
        onOpenDrawer(null, "create");
    }

    if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading views...</div>

    return (
        <aside className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
                <h2 className="text-xl font-semibold">Views</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCreateNew} title="Create View from current scene">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {views?.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm mt-10">
                        No views created yet.
                    </div>
                )}

                {views?.map((view) => (
                    <div
                        key={view._id}
                        className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-md transition-all flex flex-col"
                    >
                        {/* Thumbnail Image */}
                        <div
                            className="aspect-video w-full bg-slate-100 cursor-pointer relative"
                            onClick={() => onRestoreView(view)} // Click hình để restore view ngay
                        >
                            {view.viewState?.thumbnail ? (
                                <img
                                    src={view.viewState.thumbnail}
                                    alt={view.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Camera className="w-8 h-8" />
                                </div>
                            )}

                            {/* Overlay Hint */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Apply View
                                </div>
                            </div>
                        </div>

                        {/* Content & Actions */}
                        <div className="p-3 flex items-start justify-between gap-2 border-t">
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onOpenDrawer(view, "view")} // Click tên để xem chi tiết text
                            >
                                <h3 className="font-medium text-sm truncate text-foreground" title={view.title}>{view.title}</h3>
                                <p className="text-xs text-muted-foreground truncate">
                                    {new Date(view.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Action Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onOpenDrawer(view, "edit")}>
                                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Info
                                    </DropdownMenuItem>

                                    {/* Update Snapshot */}
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
                ))}
            </div>
        </aside>
    )
}