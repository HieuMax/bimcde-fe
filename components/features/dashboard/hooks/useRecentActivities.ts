"use client";

import { useCallback, useEffect, useState } from "react";
import { activityService } from "@/services/activity.service";
import { IActivity } from "@/types/activity";

const RECENT_ACTIVITY_LIMIT = 6;

export type UseRecentActivitiesResult = {
  activities: IActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useRecentActivities(
  projectId: string | undefined,
  limit: number = RECENT_ACTIVITY_LIMIT
): UseRecentActivitiesResult {
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setActivities([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await activityService.getActivities({
        projectId,
        page: 1,
        limit,
        lightweight: true, // skip restoreStatus for faster dashboard load
      });
      setActivities(response.data ?? []);
    } catch (err) {
      console.error("Failed to fetch recent activities:", err);
      setError(err instanceof Error ? err.message : "Failed to load activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return { activities, loading, error, refetch: fetchRecent };
}
