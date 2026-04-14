"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { explorerService } from "@/services/explorer.service";
import { IFile, IFolder } from "@/types/explorer";
import type { PromoteTargetStage } from "@/lib/explorer/cdePromote";
import { AxiosError } from "axios";
import { useAuth } from "@/app/context/authContext";

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

export function useExplorerActions(
  projectId: string,
  folderId: string | null,
  onSuccessCallback?: () => void,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Helper invalidate
  const invalidateExplorer = () => {
    queryClient.invalidateQueries({ queryKey: ["explorer", projectId] });
    queryClient.invalidateQueries({ queryKey: ["folder-tree", projectId] });
    queryClient.invalidateQueries({ queryKey: ["explorer-move-nav"] });
    queryClient.invalidateQueries({ queryKey: ["explorer-promote-nav"] });
    queryClient.invalidateQueries({ queryKey: ["explorer-archive-move-nav"] });
    queryClient.invalidateQueries({ queryKey: ["cde-root-folder"] });
    queryClient.invalidateQueries({ queryKey: ["file-publish-readiness"] });
  };

  // 1. CREATE FOLDER
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user || !user!._id) {
        throw new Error("User is not authenticated");
      }
      return await explorerService.createFolder({
        name,
        projectId,
        parentId: folderId,
        createdBy: user!._id,
      });
    },
    onSuccess: () => {
      invalidateExplorer();
      toast.success("Folder created successfully");
    },
    // Errors surfaced inline in CreateFolderDialog (no duplicate toast)
  });

  // 2. UPLOAD FILES
  const uploadFilesMutation = useMutation({
    mutationFn: async (args: {
      files: File[];
      onProgress?: (percent: number) => void;
    }) => {
      return await explorerService.uploadFiles({
        files: args.files,
        projectId,
        folderId,
        userId: user!._id,
        onProgress: args.onProgress,
      });
    },
    onSuccess: () => {
      invalidateExplorer();
      toast.success(`Uploaded successfully`);
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.message || err.message || "Upload failed";
      toast.error(msg);
    },
  });

  // 3. DELETE ITEM
  const deleteItemMutation = useMutation({
    mutationFn: async ({ id, isFile }: { id: string; isFile: boolean }) => {
      return await explorerService.deleteItem(id, isFile, user!._id);
    },
    onSuccess: () => {
      invalidateExplorer();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.message || err.message || "Delete failed";
      toast.error(msg);
    },
  });

  // Handler Bulk Delete
  const handleBulkDelete = async (items: (IFile | IFolder)[]) => {
    const count = items.length;
    if (count === 0) return;
    if (!confirm(`Are you sure you want to delete ${count} item(s)?`)) return;

    const promises = items.map((item) => {
      const isFile = "mimeType" in item;
      return deleteItemMutation.mutateAsync({ id: item._id, isFile });
    });

    try {
      await Promise.all(promises);
      toast.success(`Deleted ${count} item(s) successfully`);
      onSuccessCallback?.();
    } catch (error) {
      console.error(error);
    }
  };

  // 4. RENAME ITEM
  const renameMutation = useMutation({
    mutationFn: async ({
      item,
      newName,
    }: {
      item: IFile | IFolder;
      newName: string;
    }) => {
      const isFile = "mimeType" in item;
      if (isFile) {
        return await explorerService.renameFile(item._id, newName, user!._id);
      } else {
        return await explorerService.renameFolder(item._id, newName, user!._id);
      }
    },
    onSuccess: () => {
      invalidateExplorer();
      toast.success("Renamed successfully");
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg = err.response?.data?.message || err.message || "Rename failed";
      toast.error(msg);
    },
  });

  // 5. LOCK / UNLOCK
  const toggleLockMutation = useMutation({
    mutationFn: async ({
      item,
      action,
    }: {
      item: IFile | IFolder;
      action: "LOCK" | "UNLOCK";
    }) => {
      const isFile = "mimeType" in item;
      if (isFile) {
        return await explorerService.toggleFileLock(
          item._id,
          action,
          user!._id,
        );
      } else {
        return await explorerService.toggleFolderLock(
          item._id,
          action,
          user!._id,
        );
      }
    },
    onSuccess: () => invalidateExplorer(),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg =
        err.response?.data?.message || err.message || "Toggle lock failed";
      toast.error(msg);
    },
  });

  const handleBulkToggleLock = async (
    items: (IFile | IFolder)[],
    action: "LOCK" | "UNLOCK",
  ) => {
    const promises = items.map((item) =>
      toggleLockMutation.mutateAsync({ item, action }),
    );
    try {
      await Promise.all(promises);
      const actionText = action === "LOCK" ? "Checked out" : "Checked in";
      toast.success(`${actionText} ${items.length} item(s) successfully`);
    } catch (error) {
      console.error(error);
    }
  };

  // 6. MOVE ITEMS
  const handleMoveItems = async (
    items: (IFile | IFolder)[],
    destinationId: string,
  ) => {
    if (items.length === 0) return;
    if (destinationId === (folderId || "")) {
      toast.error("Cannot move items into the same folder.");
      return;
    }

    toast.loading(`Moving ${items.length} item(s)...`);

    const fileIds = items
      .filter((item) => "mimeType" in item)
      .map((item) => item._id);

    const folders = items.filter((item) => !("mimeType" in item));

    try {
      if (fileIds.length > 0) {
        await explorerService.moveBulkItems(fileIds, destinationId, user!._id);
      }

      if (folders.length > 0) {
        const destPayload = destinationId === "" ? "" : destinationId;
        const folderPromises = folders.map((folder) =>
          explorerService.moveItem(
            folder._id,
            "folder",
            destPayload,
            user!._id,
          ),
        );
        await Promise.all(folderPromises);
      }

      invalidateExplorer();
      toast.dismiss();
      toast.success("Moved successfully");
      onSuccessCallback?.();
    } catch (error) {
      console.error(error);
      toast.dismiss();
      const msg =
        error instanceof AxiosError &&
        error.response?.data &&
        typeof (error.response.data as ApiErrorResponse).message === "string"
          ? (error.response.data as ApiErrorResponse).message
          : "Move failed";
      toast.error(msg);
    }
  };

  // 7. PROMOTE (ISO CDE)
  const promoteFileMutation = useMutation({
    mutationFn: async (args: {
      fileId: string;
      targetStage: PromoteTargetStage;
      destinationFolderId?: string | null;
    }) => {
      return explorerService.promoteFile(
        args.fileId,
        args.targetStage,
        args.destinationFolderId,
      );
    },
    onSuccess: () => {
      invalidateExplorer();
      toast.success("Promoted: a copy was created in the destination");
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg =
        err.response?.data?.message || err.message || "Promote failed";
      toast.error(msg);
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (args: { fileId: string }) => {
      return explorerService.submitFileForReview(args.fileId);
    },
    onSuccess: () => {
      invalidateExplorer();
      toast.success("Submitted for review");
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const msg =
        err.response?.data?.message || err.message || "Submit for review failed";
      toast.error(msg);
    },
  });

  // 8. DOWNLOAD
  const handleDownload = async (items: (IFile | IFolder)[]) => {
    if (items.length === 0) return;

    if (items.length > 1) {
      // Bulk Download
      toast.info(`Compressing ${items.length} items...`);
      try {
        const payload = items.map((item) => ({
          _id: item._id,
          type: ("mimeType" in item ? "file" : "folder") as "file" | "folder",
        }));
        await explorerService.downloadBulkItems(payload, projectId);
        toast.success("Download started");
      } catch (error) {
        console.error(error);
        toast.error("Failed to download items");
      }
    } else {
      // Single Download
      const item = items[0];
      try {
        const isFile = "mimeType" in item;
        const type = isFile ? "file" : "folder";
        toast.info(`Preparing download for ${item.name}...`);
        await explorerService.downloadItem(item._id, type, item.name);
        toast.success("Download started");
      } catch (error) {
        console.error(error);
        toast.error("Failed to download item");
      }
    }
  };

  return {
    createFolder: (name: string) => createFolderMutation.mutateAsync(name),
    uploadFiles: (
      files: File[],
      options?: { onProgress?: (percent: number) => void },
    ) => uploadFilesMutation.mutateAsync({ files, ...options }),
    renameItem: (item: IFile | IFolder, newName: string) =>
      renameMutation.mutateAsync({ item, newName }),
    deleteItems: handleBulkDelete,
    toggleLockItems: handleBulkToggleLock,
    moveItems: handleMoveItems,
    downloadItems: handleDownload,
    promoteFile: (
      fileId: string,
      targetStage: PromoteTargetStage,
      destinationFolderId?: string | null,
    ) =>
      promoteFileMutation.mutateAsync({
        fileId,
        targetStage,
        destinationFolderId,
      }),
    isPromoting: promoteFileMutation.isPending,
    submitFileForReview: (fileId: string) =>
      submitForReviewMutation.mutateAsync({ fileId }),
    isSubmittingReview: submitForReviewMutation.isPending,
    // Expose loading states
    isCreating: createFolderMutation.isPending,
    isUploading: uploadFilesMutation.isPending,
  };
}
