"use client";

import { useCallback, useEffect, useState } from "react";
import { fileStatsService, FileTypeStat } from "@/services/fileStats.service";

export type UseFileTypesStatsResult = {
  data: FileTypeStat[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useFileTypesStats(
  projectId: string | undefined
): UseFileTypesStatsResult {
  const [data, setData] = useState<FileTypeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stats = await fileStatsService.getFileTypeStats(projectId);
      setData(stats);
    } catch (err) {
      console.error("Failed to fetch file type stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load file types");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
