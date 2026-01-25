import { IView, CreateViewDto, UpdateViewInfoDto } from "@/types/view";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();
const BASE_URL = "/views";

export const viewService = {
    // Lấy danh sách Views theo Project
    getAll: async (projectId: string) => {
        const params = { projectId };
        const data = await api.get(BASE_URL, { params });
        return data as IView[];
    },

    // Lấy chi tiết 1 View
    getById: async (id: string) => {
        const data = await api.get(`${BASE_URL}/${id}`);
        return data as IView;
    },

    // Tạo View mới
    create: async (data: CreateViewDto) => {
        const res = await api.post(BASE_URL, data);
        return res as IView;
    },

    // Cập nhật thông tin Text (Title, Desc, ShareWith, Tags)
    updateInfo: async (id: string, data: UpdateViewInfoDto) => {
        const res = await api.patch(`${BASE_URL}/${id}`, data);
        return res as IView;
    },

    // Cập nhật góc nhìn 3D (Snapshot)
    updateSnapshot: async (id: string, data: { viewState: any, items: any[] }) => {
        const res = await api.put(`${BASE_URL}/${id}/snapshot`, data);
        return res as IView;
    },

    // Xóa View
    delete: async (id: string) => {
        await api.delete(`${BASE_URL}/${id}`);
    },
};