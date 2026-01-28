import { httpClient } from "@/lib/http-client";
import { View2DItem } from "@/types/view2d";

// 👉 sau này có thể bỏ hardcode, dùng env
const VIEW_2D_API_URL = "/views";

export const view2DService = {
  /**
   * Lấy danh sách View theo file (2D)
   */
  getViewsByFile: async (fileId: string) => {
    const response = await httpClient.get<{ data: View2DItem[] }>(
      `${VIEW_2D_API_URL}/file/${fileId}`
    );
    return response.data;
  },

  /**
   * Tạo View 2D (PDF/Image)
   */
  createView: async (payload: {
    name: string;
    description?: string;
    projectId: string;
    fileId: string;
    pageIndex: number;
    scale: number;
    rotation: number;
    previewSrc?: string;
    createdBy?: string;
  }) => {
    const response = await httpClient.post<View2DItem>(
      VIEW_2D_API_URL,
      payload
    );
    return response.data;
  },

  updateView: async (
    viewId: string,
    payload: { name: string; description?: string }
  ) => {
    const response = await httpClient.put<View2DItem>(
      `${VIEW_2D_API_URL}/${viewId}`,
      payload
    );
    return response.data;
  },

  deleteView: async (viewId: string) => {
    const response = await httpClient.delete(
      `${VIEW_2D_API_URL}/${viewId}`
    );
    return response.data;
  },
};
