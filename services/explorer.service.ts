import { FilePublishReadiness, IExplorerResponse, IFile } from "@/types/explorer";
import type { PromoteTargetStage } from "@/lib/explorer/cdePromote";
import { useApi as apiClient } from "@/app/hooks/useApi";
import { httpClient } from "@/lib/http-client";
import { client } from "@/app/utils/apiClient";

interface FetchOptions {
  headers?: Record<string, string>;
}

const api = apiClient();

export const explorerService = {
  getContent: async (
    projectId: string,
    folderId: string | null,
    sortBy: string = "name",
    sortOrder: "asc" | "desc" = "asc",
    options?: FetchOptions & {
      restrictMoveToEffectiveGroupId?: string | null;
    },
  ) => {
    const data = await api.get("/explorer/content", {
      params: {
        projectId,
        folderId: folderId || undefined,
        sortBy,
        sortOrder,
        ...(options?.restrictMoveToEffectiveGroupId
          ? {
              restrictMoveToEffectiveGroupId:
                options.restrictMoveToEffectiveGroupId,
            }
          : {}),
      },
      headers: options?.headers,
    });
    return data as IExplorerResponse;
  },

  /** ISO: id of folder directly under a CDE root for this group (group “home”), or null */
  getGroupHomeFolderId: async (
    projectId: string,
    groupId: string,
    cdeStage: string = "WIP",
  ) => {
    const data = await api.get("/explorer/group-home-folder", {
      params: { projectId, groupId, cdeStage },
    });
    return data as { folderId: string | null };
  },

  /** ISO: CDE root folder id (e.g. 3. Published) for promote destination picker */
  getCdeRootFolderId: async (projectId: string, cdeStage: string) => {
    const data = await api.get("/explorer/cde-root-folder", {
      params: { projectId, cdeStage },
    });
    return data as { folderId: string | null };
  },

  promoteFile: async (
    fileId: string,
    targetStage: PromoteTargetStage,
    destinationFolderId?: string | null,
  ) => {
    const body: {
      targetStage: PromoteTargetStage;
      destinationFolderId?: string;
    } = { targetStage };
    if (destinationFolderId && destinationFolderId.length > 0) {
      body.destinationFolderId = destinationFolderId;
    }
    const data = await api.post(`/files/${fileId}/promote`, body);
    return data;
  },

  submitFileForReview: async (fileId: string) => {
    const data = await api.post(`/files/${fileId}/submit-review`, {});
    return data;
  },

  /** ISO: checklist before Promote to Published (Shared file) */
  getFilePublishReadiness: async (fileId: string) => {
    const data = await api.get(`/files/${fileId}/publish-readiness`);
    return data as FilePublishReadiness;
  },

  createFolder: async (payload: {
    name: string;
    projectId: string;
    parentId: string | null;
    createdBy?: string;
  }) => {
    const data = await api.post("/folders", payload);
    return data;
  },

  uploadFiles: async (payload: {
    files: File[];
    projectId: string;
    folderId: string | null;
    userId: string;
    onProgress?: (percent: number) => void;
  }) => {
    const { files, projectId, folderId, userId, onProgress } = payload;

    const totalBytes = files.reduce((s, f) => s + f.size, 0) || 1;
    let doneBytes = 0;
    const results: unknown[] = [];

    // Legacy behavior: multipart upload only (no chunking)
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batchFiles = files.slice(i, i + BATCH_SIZE);
      if (batchFiles.length === 0) continue;

      const formData = new FormData();
      batchFiles.forEach((file) => formData.append("files", file));
      formData.append("projectId", projectId);
      if (folderId) formData.append("folderId", folderId);
      formData.append("userId", userId);

      const batchBytes = batchFiles.reduce((s, f) => s + f.size, 0) || 1;
      const res = await client.post("/files/upload", formData, {
        onUploadProgress: (e) => {
          const t = e.total || batchBytes || 1;
          const ratio = Math.min(1, e.loaded / t);
          onProgress?.(
            Math.min(
              99,
              Math.round(((doneBytes + ratio * batchBytes) / totalBytes) * 100),
            ),
          );
        },
      });

      const batchRes = res.data;
      results.push(...(Array.isArray(batchRes) ? batchRes : [batchRes]));
      doneBytes += batchBytes;
      onProgress?.(Math.min(100, Math.round((doneBytes / totalBytes) * 100)));
    }

    onProgress?.(100);
    return results;
  },

  deleteItem: async (id: string, isFile: boolean, userId: string) => {
    const endpoint = isFile ? `/files/${id}` : `/folders/${id}`;
    const data = await api.delete(endpoint, {
      data: { userId },
    });
    return data;
  },

  renameFolder: async (folderId: string, newName: string, userId: string) => {
    const data = await api.put(`/folders/${folderId}/rename`, {
      name: newName,
      userId,
    });
    return data;
  },

  renameFile: async (fileId: string, newName: string, userId: string) => {
    const data = await api.put(`/files/${fileId}/rename`, {
      name: newName,
      userId,
    });
    return data;
  },

  toggleFileLock: async (
    fileId: string,
    action: "LOCK" | "UNLOCK",
    userId: string,
    options?: FetchOptions
  ) => {
    const data = await api.post(
      `/files/${fileId}/lock`,
      { action, userId },
      { headers: options?.headers }
    );
    return data;
  },

  toggleFolderLock: async (
    folderId: string,
    action: "LOCK" | "UNLOCK",
    userId: string,
    options?: FetchOptions
  ) => {
    const data = await api.post(
      `/files/bulk-lock`,
      { folderId, action, userId },
      { headers: options?.headers }
    );
    return data;
  },

  downloadItem: async (
    id: string,
    type: "file" | "folder",
    fileName: string
  ) => {
    try {
      const blob = await api.get(`/files/download`, {
        params: { id, type },
        responseType: "blob",
      });

      const downloadBlob =
        blob instanceof Blob ? blob : new Blob([blob as BlobPart]);

      const url = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");
      link.href = url;

      const downloadName = type === "folder" ? `${fileName}.zip` : fileName;
      link.setAttribute("download", downloadName);

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      throw error;
    }
  },

  moveItem: async (
    id: string,
    type: "file" | "folder",
    destinationFolderId: string,
    userId: string
  ) => {
    const endpoint =
      type === "file" ? `/files/${id}/move` : `/folders/${id}/move`;
    const body =
      type === "file"
        ? { destinationFolderId, userId }
        : { destinationParentId: destinationFolderId, userId };

    const data = await api.put(endpoint, body);
    return data;
  },

  moveBulkItems: async (
    fileIds: string[],
    destinationFolderId: string,
    userId: string
  ) => {
    return await api.post("/files/move-bulk", {
      fileIds,
      destinationFolderId,
      userId,
    });
  },

  downloadBulkItems: async (
    items: { _id: string; type: "file" | "folder" }[],
    projectId: string
  ) => {
    const payload = items.map((i) => ({ id: i._id, type: i.type }));

    const response = await api.postRaw(
      "/files/download-bulk",
      { items: payload, projectId },
      { responseType: "blob" }
    );

    const blob = response.data;
    const headers = response.headers;

    let filename = "download.zip";
    const disposition = headers["content-disposition"];

    if (disposition && disposition.indexOf("attachment") !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }

    // Logic create link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  assignTags: async (fileIds: string[], tagIds: string[]) => {
    const data = await api.post("/files/bulk-tags", {
      fileIds,
      tagIds,
    });
    return data;
  },
  assignFolderTags: async (folderIds: string[], tagIds: string[]) => {
    const data = await api.post("/folders/bulk-tags", {
      folderIds,
      tagIds,
    });
    return data;
  },

  getFileDetail: async (id: string) => {
    const data = await api.get(`/files/${id}`);
    return data;
  },

  getFileByShare: async (shareToken: string) => {
    const res = await httpClient.get<{
      projectId: string;
      fileId: string;
      viewId: string;
      accessLevel: string;
      type: string;
    }>(`/share/${shareToken}`);

    return res.data;
  },

  getFileDetailPublic: async (id: string, shareToken: string) => {
    const data = await api.get(`/share/file/${id}`, {
      params: {
        shareToken: shareToken 
      }
    });
    return data as IFile | any;
  },

};
