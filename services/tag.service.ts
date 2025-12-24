import { ITag } from "@/types/tag";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();
const BASE_URL = "/tags";

export const tagService = {
  getAll: async (projectId: string) => {
    const data = await api.get(BASE_URL, { params: { projectId } });
    return data as ITag[];
  },

  create: async (data: { name: string; color?: string; projectId: string }) => {
    const res = await api.post(BASE_URL, data);
    return res as ITag;
  },

  update: async (id: string, data: { name?: string; color?: string }) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res as ITag;
  },

  delete: async (id: string) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res;
  },
};
