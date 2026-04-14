/* Viewer + todo drawer: TopicItem APIs under /topics/items (single collection with /topics). */
import { useApi as apiClient } from "@/app/hooks/useApi";
import { TopicItem, TopicFilters } from "@/types/topic3d";

const api = apiClient();
const BASE = "/topics/items";

function unwrap<T>(data: unknown): T {
  if (
    data &&
    typeof data === "object" &&
    "result" in (data as object) &&
    (data as { result?: unknown }).result !== undefined
  ) {
    return (data as { result: T }).result;
  }
  return data as T;
}

export const topicService = {
  getTopicsByProject: async (projectId: string, filters?: TopicFilters) => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.search) queryParams.append("search", filters.search);

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    const data = await api.get(
      `${BASE}/viewer/${projectId}${queryString}`,
    );
    return data as TopicItem[];
  },

  getTopicById: async (topicId: string) => {
    const data = await api.get(`${BASE}/detail/${topicId}`);
    return data as TopicItem;
  },

  createTopic: async (payload: Partial<TopicItem> & { projectId?: string }) => {
    const projectId = payload.projectId;
    if (!projectId) {
      throw new Error("projectId is required to create a topic");
    }
    const { projectId: _p, ...body } = payload;
    const res = await api.post(`${BASE}/create/${projectId}`, body);
    return unwrap<TopicItem>(res);
  },

  updateTopic: async (topicId: string, payload: Partial<TopicItem>) => {
    const res = await api.patch(`${BASE}/${topicId}`, payload);
    return unwrap<TopicItem>(res);
  },

  deleteTopic: async (topicId: string) => {
    await api.delete(`${BASE}/${topicId}`);
  },

  addSnapshot: async (topicId: string, payload: unknown) => {
    const res = await api.post(`${BASE}/${topicId}/snapshots`, payload);
    return res as TopicItem;
  },

  getLinkableTopics: async (projectId: string) => {
    const data = await api.get(`${BASE}/linkable/${projectId}`);
    return data as TopicItem[];
  },

  getOpenLinkedTodoCount: async (topicId: string) => {
    const data = await api.get(
      `${BASE}/open-linked-todos-count/${topicId}`,
    );
    return data as { count: number };
  },
};
