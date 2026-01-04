import { IFolder } from "@/types/explorer";
import { useApi as apiClient } from "@/app/hooks/useApi";

const api = apiClient();

export const folderService = {
  getFolders: async (projectId: string, parentId: string | null = null) => {
    const data = await api.get("/folders", {
      params: {
        projectId,
        parentId: parentId || "",
      },
    });

    return data as IFolder[];
  },
};
