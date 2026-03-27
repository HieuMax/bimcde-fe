import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export interface FileTypeStat {
  extension: string;
  count: number;
}

export const fileStatsService = {
  getFileTypeStats: async (projectId: string): Promise<FileTypeStat[]> => {
    const data = await api.get("/files/stats/file-types", {
      params: { projectId },
    });
    return Array.isArray(data) ? data : [];
  },

  getProjectStorageUsed: async (projectId: string): Promise<number> => {
    const data = (await api.get("/files/stats/storage", {
      params: { projectId },
    })) as { totalBytes?: number };
    return data?.totalBytes ?? 0;
  },
};
