import { useApi as apiClient } from "@/app/hooks/useApi";
// import { View2DItem } from "@/types/view2d";
import { IView } from "@/types/view";

const api = apiClient();
const BASE_URL = "/views";

export const view2DService = {
  /**
   * GIỮ NGUYÊN TÊN HÀM CŨ
   */
  getViewsByFile: async (fileId: string) => {
    const data = await api.get(`${BASE_URL}/file/${fileId}`);
    return data as IView[];
  },

  getViewsByProject: async (projectId: string) => {
    const data = await api.get(`${BASE_URL}/project/${projectId}`);
    return data as IView[];
  },

  /**
   * GIỮ NGUYÊN createView
   */
  createView: async (payload: Partial<IView>) => {
    const res = await api.post(BASE_URL, payload);
    return res as IView;
  },

  updateView: async (
    viewId: string,
    payload: Partial<IView>
  ) => {
    const res = await api.put(`${BASE_URL}/${viewId}`, payload);
    return res as IView;
  },

  deleteView: async (viewId: string) => {
    await api.delete(`${BASE_URL}/${viewId}`);
  },
};
