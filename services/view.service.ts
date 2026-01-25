import { IView, CreateViewDto, UpdateViewInfoDto } from "@/types/view";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();
const BASE_URL = "/views";

export const viewService = {
    getAll: async (projectId: string) => {
        const params = { projectId };
        const data = await api.get(BASE_URL, { params });
        return data as IView[];
    },

    getById: async (id: string) => {
        const data = await api.get(`${BASE_URL}/${id}`);
        return data as IView;
    },

    create: async (data: CreateViewDto) => {
        const res = await api.post(BASE_URL, data);
        return res as IView;
    },

    updateInfo: async (id: string, data: UpdateViewInfoDto) => {
        const res = await api.patch(`${BASE_URL}/${id}`, data);
        return res as IView;
    },

    updateSnapshot: async (id: string, data: { viewState: any, items: any[] }) => {
        const res = await api.put(`${BASE_URL}/${id}/snapshot`, data);
        return res as IView;
    },

    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    },
};