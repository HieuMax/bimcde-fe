import { useApi as apiClient } from "@/app/hooks/useApi";

type TopicOption = {
  _id?: string;
  projectId?: string;
  icon?: string;
  name: string;
  color?: string;
  visible?: boolean;
  isDefault?: boolean;
};

export const topicSettingsService = {
  getAll: async (projectId: string): Promise<{
    topicTypes: TopicOption[];
    topicStatuses: TopicOption[];
    topicPriorities: TopicOption[];
  }> => {
    const api = apiClient();
    const res = await api.get(`/topics/getAll/${projectId}`);

    const result = res?.result ?? {};

    return {
      topicTypes: (result.topicTypes ?? []) as TopicOption[],
      topicStatuses: (result.topicStatuses ?? []) as TopicOption[],
      topicPriorities: (result.topicPriorities ?? []) as TopicOption[],
    };
  },
};

