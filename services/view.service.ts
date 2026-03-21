import { CreateViewDTO, ViewItem, UpdateViewDTO } from "@/types/view";
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
    return data as ViewItem[];
  },

  getViewById: async (viewId: string) => {
    const data = await api.get(`/views/${viewId}`);
    return data as ViewItem;
  },

  createView: async (viewData: CreateViewDTO) => {
    const data = await api.post("/views", viewData);
    return data as ViewItem;
  },

  updateView: async (viewId: string, updateData: UpdateViewDTO) => {
    const data = await api.put(`/views/${viewId}`, updateData);
    return data as ViewItem;
  },

  downloadProxiedImage: async (remoteUrl: string): Promise<Blob> => {
    const res = await api.get('/files/proxy', {
      params: { url: remoteUrl },
      responseType: 'blob', 
    });
    return res;
  },

  deleteView: async (viewId: string) => {
    const data = await api.delete(`/views/${viewId}`);
    return data;
  },
};
