import { IExplorerResponse } from "@/types/explorer";
import { useApi as apiClient } from "@/app/hooks/useApi";

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
    options?: FetchOptions
  ) => {
    const data = await api.get("/explorer/content", {
      params: {
        projectId,
        folderId: folderId || undefined,
        sortBy,
        sortOrder,
      },
      headers: options?.headers,
    });
    return data as IExplorerResponse;
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
  }) => {
    const formData = new FormData();
    payload.files.forEach((file) => formData.append("files", file));

    formData.append("projectId", payload.projectId);
    if (payload.folderId) formData.append("folderId", payload.folderId);
    formData.append("userId", payload.userId);

    const data = await api.post("/files/upload", formData);
    return data;
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
};
