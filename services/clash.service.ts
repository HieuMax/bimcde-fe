import { IClashSet, CreateClashSetDto } from "@/types/clash";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();
const BASE_URL = "/clash-sets";

export const clashService = {
    getAll: async (projectId: string) => {
        const params = { projectId };
        const data = await api.get(BASE_URL, { params });
        return data as IClashSet[];
    },

    getById: async (id: string) => {
        const data = await api.get(`${BASE_URL}/${id}`);
        return data as IClashSet;
    },

    create: async (data: CreateClashSetDto) => {
        const res = await api.post(BASE_URL, data);
        return res as IClashSet;
    },

    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};