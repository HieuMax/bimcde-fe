"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { explorerService } from "@/services/explorer.service";
import { IFile, IFolder } from "@/types/explorer";

export type SortConfig = {
  key: "name" | "date" | "size";
  direction: "asc" | "desc";
};

export function useExplorerData(projectId: string, folderId: string | null) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });

  // Data Fetching
  const { data, isLoading, isPlaceholderData, refetch } = useQuery({
    queryKey: [
      "explorer",
      projectId,
      folderId,
      sortConfig.key,
      sortConfig.direction,
    ],
    queryFn: () =>
      explorerService.getContent(
        projectId,
        folderId,
        sortConfig.key,
        sortConfig.direction
      ),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });

  // Sort
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return {
    folders: data?.subFolders || ([] as IFolder[]),
    files: data?.files || ([] as IFile[]),
    currentFolder: data?.currentFolder || null,
    ancestors: data?.ancestors || [],
    isLoading,
    isPlaceholderData,
    refetch,
    sortConfig,
    handleSort,
  };
}
