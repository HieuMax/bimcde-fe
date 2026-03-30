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

  getProjectStorageStats: async (
    projectId: string,
  ): Promise<{ totalBytes: number; limitBytes: number }> => {
    const data = (await api.get("/files/stats/storage", {
      params: { projectId },
    })) as { totalBytes?: number; limitBytes?: number };
    const fallbackLimit = 500 * 1024 * 1024;
    return {
      totalBytes: data?.totalBytes ?? 0,
      limitBytes: data?.limitBytes ?? fallbackLimit,
    };
  },
};
