/* ===================== FILE: services/topic.ts ===================== */
import { useApi as apiClient } from "@/app/hooks/useApi";
import { TopicItem, TopicFilters } from "@/types/topic3d";

const api = apiClient();
const BASE_URL = "/topic3d";

export const topicService = {
  /**
   * Lấy danh sách topics theo Project ID (có hỗ trợ filter)
   */
  getTopicsByProject: async (projectId: string, filters?: TopicFilters) => {
    // Xây dựng query string từ filters (nếu có)
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.search) queryParams.append("search", filters.search);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    
    const data = await api.get(`${BASE_URL}/project/${projectId}${queryString}`);
    return data as TopicItem[];
  },

  getTopicById: async (topicId: string) => {
    const data = await api.get(`${BASE_URL}/${topicId}`);
    return data as TopicItem;
  },

  createTopic: async (payload: Partial<TopicItem>) => {
    const res = await api.post(BASE_URL, payload);
    return res as TopicItem;
  },

  updateTopic: async (topicId: string, payload: Partial<TopicItem>) => {
    const res = await api.patch(`${BASE_URL}/${topicId}`, payload);
    return res as TopicItem;
  },

  deleteTopic: async (topicId: string) => {
    await api.delete(`${BASE_URL}/${topicId}`);
  },

  addSnapshot: async (topicId: string, payload: any) => {
    const res = await api.post(`${BASE_URL}/${topicId}/snapshots`, payload);
    return res as TopicItem;
  },
};