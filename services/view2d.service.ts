import { useApi as apiClient } from "@/app/hooks/useApi";
// import { View2DItem } from "@/types/view2d";
import { View2DItem } from "@/types/view2d";

const api = apiClient();
const BASE_URL = "/views2d";

export const view2DService = {
  /**
   * GIỮ NGUYÊN TÊN HÀM CŨ
   */
  getViewsByFile: async (fileId: string) => {
    const data = await api.get(`${BASE_URL}/file/${fileId}`);
    return data as View2DItem[];
  },

  getViewsByProject: async (projectId: string) => {
    const data = await api.get(`${BASE_URL}/project/${projectId}`);
    return data as View2DItem[];
  },

  /**
   * GIỮ NGUYÊN createView
   */
  createView: async (payload: Partial<View2DItem>) => {
    const res = await api.post(BASE_URL, payload);
    return res as View2DItem;
  },

  updateView: async (
    viewId: string,
    payload: Partial<View2DItem>
  ) => {
    const res = await api.put(`${BASE_URL}/${viewId}`, payload);
    return res as View2DItem;
  },

  deleteView: async (viewId: string) => {
    await api.delete(`${BASE_URL}/${viewId}`);
  },
};
