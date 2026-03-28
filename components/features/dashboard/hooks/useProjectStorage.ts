"use client";

import { useCallback, useEffect, useState } from "react";
import { fileStatsService } from "@/services/fileStats.service";

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export type UseProjectStorageResult = {
  usedBytes: number;
  limitBytes: number;
  freeBytes: number;
  usedPercent: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useProjectStorage(
  projectId: string | undefined,
): UseProjectStorageResult {
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setUsedBytes(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const total = await fileStatsService.getProjectStorageUsed(projectId);
      setUsedBytes(total);
      console.log(total);
    } catch (err) {
      console.error("Failed to fetch project storage:", err);
      setError(err instanceof Error ? err.message : "Failed to load storage");
      setUsedBytes(0);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  const limitBytes = STORAGE_LIMIT_BYTES;
  const freeBytes = Math.max(0, limitBytes - usedBytes);
  const usedPercent =
    limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return {
    usedBytes,
    limitBytes,
    freeBytes,
    usedPercent,
    loading,
    error,
    refetch: fetchStorage,
  };
}
