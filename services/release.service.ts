import {
  CreateReleaseDTO,
  IRelease,
  // ReleaseFilterParams,
  UpdateReleaseDTO,
} from "@/types/release";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const releaseService = {
  getReleases: async (params: {
    projectId: string;
    status?: string;
    userIds?: string[];
    groupIds?: string[];
    dueStartDate?: string;
    dueEndDate?: string;
  }) => {
    const queryParams: Record<string, string> = { projectId: params.projectId };

    if (params.status && params.status !== "ALL")
      queryParams.status = params.status;
    if (params.userIds && params.userIds.length > 0)
      queryParams.userIds = params.userIds.join(",");
    if (params.groupIds && params.groupIds.length > 0)
      queryParams.groupIds = params.groupIds.join(","); // [NEW]
    if (params.dueStartDate) queryParams.dueStartDate = params.dueStartDate;
    if (params.dueEndDate) queryParams.dueEndDate = params.dueEndDate;

    const data = await api.get("/releases", {
      params: queryParams,
    });
    return data as IRelease[];
  },

  getReleaseById: async (id: string) => {
    const data = await api.get(`/releases/${id}`);
    return data as IRelease;
  },

  createRelease: async (payload: CreateReleaseDTO) => {
    const data = await api.post("/releases", payload);
    return data as IRelease;
  },

  updateRelease: async (id: string, payload: UpdateReleaseDTO) => {
    const data = await api.put(`/releases/${id}`, payload);
    return data as IRelease;
  },

  sendRelease: async (id: string) => {
    const data = await api.post(`/releases/${id}/send`);
    return data as IRelease;
  },

  deleteRelease: async (id: string) => {
    const data = await api.delete(`/releases/${id}`);
    return data;
  },

  downloadRelease: async (id: string) => {
    try {
      // Yêu cầu responseType là 'blob' để nhận dữ liệu binary
      const response = await api.get(`/releases/${id}/download`, {
        responseType: "blob",
      });

      // Tạo Blob từ dữ liệu nhận được
      // Lưu ý: Nếu `api.get` của bạn trả về `res.data` trực tiếp thì `response` chính là blob.
      // Nếu `api.get` trả về trọn bộ AxiosResponse, bạn cần dùng `response.data`.
      // Ở đây tôi giả định wrapper trả về data trực tiếp.
      const blob = new Blob([response as BlobPart], { type: "application/zip" });

      // Tạo URL tạm thời
      const url = window.URL.createObjectURL(blob);

      // Tạo thẻ <a> ẩn để kích hoạt tải xuống
      const link = document.createElement("a");
      link.href = url;
      // Đặt tên file (Có thể cải tiến để lấy từ Header 'Content-Disposition' nếu wrapper cho phép)
      link.setAttribute("download", `release_${id}.zip`);

      document.body.appendChild(link);
      link.click();

      // Dọn dẹp
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  },

  removeFileFromRelease: async (releaseId: string, fileId: string) => {
    const data = await api.delete(`/releases/${releaseId}/items/${fileId}`);
    return data as IRelease;
  },

  removeFilesFromRelease: async (releaseId: string, fileIds: string[]) => {
    const data = await api.delete(`/releases/${releaseId}/items`, {
      data: { fileIds },
    });
    return data as IRelease;
  },

  downloadFile: async (fileId: string, version: number, fileName: string) => {
    try {
      const response = await api.get(
        `/files/download?id=${fileId}&type=file&version=${version}`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response as BlobPart]); // Presuming response is blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("File download error:", error);
      throw error;
    }
  },
};
