"use client";

import { useCallback, useEffect, useState } from "react";
import { topicsService } from "@/services/topics.service";
import { releaseService } from "@/services/release.service";
import { viewService } from "@/services/view.service";
import { viewService3D } from "@/services/view3d.service";

export type DashboardStats = {
  todos: number;
  views: {
    total: number;
    view2d: number;
    view3d: number;
  };
  topics: number;
  releases: number;
};

export type UseDashboardStatsResult = {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/** Mock todos count - will be replaced with BE integration later */
const MOCK_TODOS_COUNT = 0;

export function useDashboardStats(projectId: string | undefined): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats>({
    todos: MOCK_TODOS_COUNT,
    views: { total: 0, view2d: 0, view3d: 0 },
    topics: 0,
    releases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [topicsRes, releasesRes, views2dRes, views3dRes] = await Promise.all([
        topicsService.getTopicItems(projectId),
        releaseService.getReleases({ projectId }),
        viewService.getViews(projectId).catch(() => []),
        viewService3D.getAll(projectId).catch(() => []),
      ]);

      const toCount = (v: unknown): number =>
        Array.isArray(v) ? v.length : 0;

      const topics = toCount(topicsRes);
      const releases = toCount(releasesRes);
      const view2d = toCount(views2dRes);
      const view3d = toCount(views3dRes);

      setStats({
        todos: MOCK_TODOS_COUNT,
        views: {
          total: view2d + view3d,
          view2d,
          view3d,
        },
        topics,
        releases,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
