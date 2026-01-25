"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Eye, MoveLeft } from "lucide-react"
import { viewService } from "@/services/view.service"
import { IView } from "@/types/view"

interface ViewDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRestoreView?: (viewState: any) => void // Hàm restore camera để xem trước
    projectId: string
    viewToEdit?: IView | null
    mode: "create" | "edit" | "view"

    // Data dùng khi tạo mới (được capture từ ViewerClient)
    initialData?: {
        items?: any[];
        viewState?: any;
    } | null;
}

export function ViewDrawer({
    open,
    onOpenChange,
    onRestoreView,
    projectId,
    viewToEdit,
    mode,
    initialData
}: ViewDrawerProps) {
    const queryClient = useQueryClient()

    const defaultState = {
        title: "",
        description: "",
        shareWith: "", // Nhập text ngăn cách dấu phẩy
        tags: "",
        viewState: null as any,
    }

    const [formData, setFormData] = useState(defaultState)
    const [currentMode, setCurrentMode] = useState(mode)

    useEffect(() => {
        if (open) setCurrentMode(mode)
    }, [mode, open])

    // Populate data
    useEffect(() => {
        if (open) {
            if (viewToEdit) {
                // Edit Mode
                setFormData({
                    title: viewToEdit.title || "",
                    description: viewToEdit.description || "",
                    shareWith: viewToEdit.shareWith?.join(", ") || "",
                    tags: viewToEdit.tags?.join(", ") || "",
                    viewState: viewToEdit.viewState || null,
                })
            } else if (initialData && mode === 'create') {
                // Create Mode
                setFormData({
                    ...defaultState,
                    title: "New View", // Default title
                    viewState: initialData.viewState || null,
                })
            } else {
                setFormData(defaultState)
            }
        }
    }, [open, viewToEdit, initialData, mode])

    // Mutation: Create
    const createMutation = useMutation({
        mutationFn: viewService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["views", projectId] })
            toast.success("View created successfully")
            handleClose()
        },
        onError: (error: any) => toast.error(error.message || "Failed to create view")
    })

    // Mutation: Update Info
    const updateMutation = useMutation({
        mutationFn: (data: any) => viewService.updateInfo(viewToEdit!._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["views", projectId] })
            toast.success("View updated successfully")
            handleClose()
        },
        onError: (error: any) => toast.error(error.message || "Failed to update view")
    })

    const handleSave = () => {
        if (!formData.title.trim()) {
            toast.error("Title is required")
            return
        }

        const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(t => t.length > 0)
        const shareWithArray = formData.shareWith.split(",").map(s => s.trim()).filter(s => s.length > 0)

        const payload: any = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            shareWith: shareWithArray,
            tags: tagsArray,
            projectId
        }

        if (viewToEdit) {
            updateMutation.mutate(payload)
        } else {
            // Khi tạo mới thì gửi kèm item và viewState
            payload.items = initialData?.items || [];
            payload.viewState = initialData?.viewState;
            createMutation.mutate(payload)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        setFormData(defaultState)
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <Sheet open={open} onOpenChange={handleClose} modal={false}>
            <SheetContent
                className="w-[400px] flex flex-col p-0 border-l shadow-2xl"
                onInteractOutside={(e) => e.preventDefault()}
                style={{ pointerEvents: "auto", zIndex: 50 }}
            >
                <SheetHeader className="border-b px-6 py-4">
                    <SheetTitle>
                        {currentMode === 'create' ? "New View" : currentMode === 'edit' ? "Edit View" : "View Details"}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                    {/* Thumbnail Preview */}
                    {formData.viewState?.thumbnail && (
                        <div className="relative group border rounded-lg overflow-hidden shadow-sm cursor-pointer"
                            onClick={() => {
                                if (onRestoreView && formData.viewState) {
                                    onRestoreView(formData.viewState);
                                    toast.success("Restoring View...");
                                }
                            }}
                        >
                            <img
                                src={formData.viewState.thumbnail}
                                alt="View Snapshot"
                                className="w-full h-48 object-cover bg-slate-100"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex items-center gap-2 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <Eye className="w-4 h-4" /> <span>Restore</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                disabled={currentMode === 'view'}
                                placeholder="Living Room Perspective..."
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={currentMode === 'view'}
                                className="resize-none h-24"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Share With (Emails)</Label>
                            <Input
                                value={formData.shareWith}
                                onChange={e => setFormData({ ...formData, shareWith: e.target.value })}
                                disabled={currentMode === 'view'}
                                placeholder="user1@example.com, user2@example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>Tags</Label>
                            <Input
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                disabled={currentMode === 'view'}
                                placeholder="architectural, review..."
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t px-6 py-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    {currentMode !== 'view' && (
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? "Saving..." : "Save"}
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}