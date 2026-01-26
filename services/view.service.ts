// src/services/view.service.ts
import { httpClient } from "@/lib/http-client"; // Import wrapper bạn đã viết
import { ViewItem } from "@/types/view";

// 👇 ĐỊNH NGHĨA API RIÊNG CHO VIEW (Trỏ về Local)
const VIEW_API_URL = "http://localhost:4000/api";

export const viewService = {
  /**
   * Lấy danh sách Views
   */
  getViewsByFile: async (fileId: string) => {
    const response = await httpClient.get<{ data: ViewItem[] }>(
      `${VIEW_API_URL}/views/file/${fileId}`
    );

    return response.data; 
  },

  /**
   * Tạo View mới
   */
  createView: async (payload: {
    name: string;
    description: string;
    projectId: string;
    fileId: string;
    pageIndex: number;
    scale: number;
    rotation: number;
    previewSrc?: string;
    createdBy?: string; // 👈 Thêm createdBy
  }) => {
    // Truyền Full URL
    const response = await httpClient.post<ViewItem>(
      `${VIEW_API_URL}/views`, 
      payload
    );
    return response.data;
  },

  updateView: async (
    viewId: string,
    payload: { name: string; description?: string }
  ) => {
    const response = await httpClient.put<ViewItem>(
      `${VIEW_API_URL}/views/${viewId}`,
      payload
    );

    return response.data;
  },


  deleteView: async (viewId: string) => {
    // Gọi method DELETE
    const response = await httpClient.delete(
        `${VIEW_API_URL}/views/${viewId}`
    );
    return response.data;
  }
};