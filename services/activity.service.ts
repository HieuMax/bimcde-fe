import { ActivityFilterParams, ActivityResponse } from "@/types/activity";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const activityService = {
  getActivities: async (params: ActivityFilterParams) => {
    // Remove undefined/null values
    const queryParams: Record<string, string | number | boolean> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams[key] = value;
      }
    });

    const data = await api.get("/activities", {
      params: queryParams,
    });
    return data as ActivityResponse;
  },

  // Optional: if we need to log custom activities from FE
  logActivity: async (payload: Record<string, unknown>) => {
    const data = await api.post("/activities", payload);
    return data;
  },

  getProjectMembers: async (projectId: string) => {
    const data = await api.get(`/projects/${projectId}/members`);
    return data;
  },

  restoreItem: async (
    itemId: string,
    itemModel: "File" | "Folder",
    userId: string,
  ) => {
    const endpoint = itemModel === "Folder" ? "/folders" : "/files";

    const data = await api.post(`${endpoint}/${itemId}/restore`, {
      userId,
    });
    return data;
  },
};
