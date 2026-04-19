"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { MiniFileExplorer } from "./MiniFileExplorer";
import { IFile } from "@/types/explorer";
import { toast } from "sonner";
import { explorerService } from "@/services/explorer.service";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    userId: string;
    onAttach: (files: { name: string; url: string; mimeType: string; size: number; fileId?: string }[]) => void;
    // BỔ SUNG PROP NÀY:
    hideUpload?: boolean;
}

export function AttachFileDialog({ open, onOpenChange, projectId, userId, onAttach, hideUpload = false }: Props) {
    const [activeTab, setActiveTab] = useState("project");
    const [uploading, setUploading] = useState(false);

    // --- UPLOAD LOCAL ---
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setUploading(true);
        try {
            const res: any = await explorerService.uploadFiles({
                files: acceptedFiles,
                projectId,
                folderId: null, // Upload to Root -- Optional
                userId,
            });

            const uploadedFiles = Array.isArray(res) ? res : [res];

            const attachments = uploadedFiles.map((f: any) => {
                const versionData = f.versions && f.versions.length > 0 ? f.versions[0] : {};

                return {
                    name: f.name,
                    fileId: f._id,
                    url: versionData.location || f.location || "",
                    mimeType: versionData.mimeType || f.mimeType || "application/octet-stream",
                    size: versionData.size || f.size || 0
                };
            });

            onAttach(attachments);
            onOpenChange(false);
            toast.success("Files uploaded and attached");
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    }, [projectId, userId, onAttach, onOpenChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    // --- SELECT FROM PROJECT ---
    const handleProjectSelect = (files: IFile[]) => {
        const attachments = files.map((f: any) => ({
            name: f.name,
            fileId: f._id,
            url: f.location,
            mimeType: f.mimeType,
            size: f.size,
        }));
        onAttach(attachments);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Attach Files</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="project" value={activeTab} onValueChange={setActiveTab} className="w-full">

                    {/* CHỈ HIỂN THỊ TAB LIST NẾU KHÔNG BỊ ẨN */}
                    {!hideUpload && (
                        <div className="px-6 pt-2">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="project">From Project</TabsTrigger>
                                <TabsTrigger value="local">Upload from Device</TabsTrigger>
                            </TabsList>
                        </div>
                    )}

                    {/* TAB 1: FROM PROJECT */}
                    {/* Bỏ margin-top và border nếu không có TabList ở trên */}
                    <TabsContent value="project" className={`m-0 ${!hideUpload ? 'border-t mt-2' : ''}`}>
                        <MiniFileExplorer projectId={projectId} onConfirm={handleProjectSelect} />
                    </TabsContent>

                    {/* TAB 2: LOCAL UPLOAD (Chỉ render khi hideUpload = false) */}
                    {!hideUpload && (
                        <TabsContent value="local" className="m-0 border-t mt-2 p-6 min-h-[300px]">
                            <div
                                {...getRootProps()}
                                className={`
                                    border-2 border-dashed rounded-lg h-64 w-full flex flex-col items-center justify-center 
                                    transition-colors cursor-pointer
                                    ${isDragActive ? "bg-blue-50 border-blue-400" : "bg-slate-50 border-slate-300 hover:bg-slate-100"}
                                `}
                            >
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                        <p className="text-sm text-slate-500">Uploading...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-500">
                                        <div className="p-3 bg-white rounded-full shadow-sm">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                                            <p className="text-xs">SVG, PNG, JPG, PDF, IFC...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}