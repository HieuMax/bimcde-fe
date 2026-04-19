"use client";

import React, { useEffect, useState, useCallback } from "react";
import { activityService } from "@/services/activity.service";
import { IActivity, ActivityFilterParams } from "@/types/activity";
import { ActivityItem } from "./ActivityItem";
import { ActivityFilters } from "./ActivityFilters";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActivityFeedProps {
  projectId: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<{
    actionGroup?: string;
    actionTypes?: string;
    userIds?: string[];
    groupIds?: string[];
    startDate?: string;
    endDate?: string;
  }>({});

  const fetchActivities = useCallback(
    async (reset: boolean = false) => {
      try {
        const currentPage = reset ? 1 : page;
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const params: ActivityFilterParams = {
          projectId,
          page: currentPage,
          limit: 20,
          actionGroup: filters.actionGroup,
          actionTypes: filters.actionTypes,
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.userIds?.join(","),
          groupIds: filters.groupIds?.join(","),
        };

        const response = await activityService.getActivities(params);

        if (reset) {
          setActivities(response.data);
          console.log("Fetched Activities:", response.data);
          setPage(2);
        } else {
          setActivities((prev) => [...prev, ...response.data]);
          setPage((prev) => prev + 1);
        }

        setHasMore(response.page < response.totalPages);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, page, filters],
  );

  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, projectId]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    fetchActivities(true);
  };

  return (
    // Thay đổi style container: bỏ border radius bo tròn quá mức, dùng nền trắng chuẩn
    <div className="flex flex-col h-full bg-white rounded-md shadow-sm border border-gray-200">
      <div className="flex shrink-0 items-center justify-between rounded-t-md border-b border-gray-100 bg-white px-4 py-2.5">
        <h2 className="text-lg font-medium text-gray-800">Activity</h2>
        <span
          aria-hidden
          className="pointer-events-none inline-flex shrink-0 select-none items-center justify-center rounded px-6 py-2 text-base font-medium opacity-0"
        >
          New
        </span>
      </div>

      <ActivityFilters
        projectId={projectId}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <p>No activities found matching your criteria</p>
          </div>
        ) : (
          <div className="bg-white">
            {activities.map((activity) => (
              <ActivityItem
                key={activity._id}
                activity={activity}
                projectId={projectId}
              />
            ))}
          </div>
        )}

        {hasMore && !loading && activities.length > 0 && (
          <div className="p-4 flex justify-center bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActivities(false)}
              disabled={loadingMore}
              className="text-gray-600 border-gray-300"
            >
              {loadingMore && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Show more activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
