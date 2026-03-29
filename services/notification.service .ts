import { useApi as apiClient } from "@/app/hooks/useApi";
import { INotification } from "@/types/notification";

const api = apiClient();

export const NotificationService = {
  getAllNotification: async (userId: string | undefined) => {
    const data = await api.get(`/notification/${userId}`);
    return data as INotification[];
  },

  deleteNotification: async (notificationId: string) => {
    const res = await api.delete(`/notification/delete/${notificationId}`);
    return res;
  },

  deleteAllNotification: async (userId: string) => {
    const res = await api.delete(`/notification/deleteAll/${userId}`);
    return res;
  },

  readNotification: async (notificationId: string) => {
    const res = await api.put(`/notification/read/${notificationId}`);
    return res;
  },

  readAllNotification: async (userId: string) => {
    const res = await api.put(`/notification/readAll/${userId}`);
    return res;
  },
};
