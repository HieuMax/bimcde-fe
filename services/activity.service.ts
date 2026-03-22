import { ActivityFilterParams, ActivityResponse } from "@/types/activity";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const activityService = {
  getActivities: async (params: ActivityFilterParams) => {
    // Remove undefined/null values
    const queryParams: Record<string, string | number | boolean> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "lightweight") {
          queryParams[key] = value ? "true" : "false";
        } else {
          queryParams[key] = value;
        }
      }
    });

    const raw = await api.get("/activities", {
      params: queryParams,
    });
    // BE returns { data, pagination } - normalize to ActivityResponse
    if (raw && typeof raw === "object" && "pagination" in raw && raw.pagination) {
      const pagination = raw.pagination as { total?: number; page?: number; limit?: number; totalPages?: number };
      return {
        data: (raw.data ?? []) as ActivityResponse["data"],
        total: pagination.total ?? 0,
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        totalPages: pagination.totalPages ?? 0,
      } as ActivityResponse;
    }
    return raw as ActivityResponse;
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
