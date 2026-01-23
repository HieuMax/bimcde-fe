import { CreateViewDTO, IView, UpdateViewDTO } from "@/types/view";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const viewService = {
  getViews: async (
    projectId: string,
    filters?: { type?: string; createdBy?: string }
  ) => {
    const params: Record<string, string> = { projectId };
    if (filters?.type) params.type = filters.type;
    if (filters?.createdBy) params.createdBy = filters.createdBy;

    const data = await api.get("/views", { params });
    return data as IView[];
  },

  getViewById: async (viewId: string) => {
    const data = await api.get(`/views/${viewId}`);
    return data as IView;
  },

  createView: async (viewData: CreateViewDTO) => {
    const data = await api.post("/views", viewData);
    return data as IView;
  },

  updateView: async (viewId: string, updateData: UpdateViewDTO) => {
    const data = await api.put(`/views/${viewId}`, updateData);
    return data as IView;
  },

  deleteView: async (viewId: string) => {
    const data = await api.delete(`/views/${viewId}`);
    return data;
  },
};
