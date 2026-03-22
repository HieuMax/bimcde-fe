"use client";

import React from "react";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { IActivity } from "@/types/activity";
import { useRecentActivities } from "./hooks/useRecentActivities";

function getActionLabel(activity: IActivity): string {
  const { actionType, actionGroup } = activity;
  if (actionGroup === "RELEASE" && actionType === "ADD_FILE") return "added file(s) to";
  if (actionType === "CREATE") return "created new";
  if (actionType === "DELETE") return "deleted";
  if (actionType === "UPDATE") return "updated";
  if (actionType === "RESTORE") return "restored";
  if (actionType === "RENAME") return "renamed";
  if (actionType === "UPLOAD") return "uploaded";
  if (actionType === "COMMENT" || actionGroup === "TOPIC") return "commented on";
  return actionType.replace(/_/g, " ").toLowerCase();
}

interface RecentActivitySectionProps {
  projectId: string | undefined;
}

export function RecentActivitySection({ projectId }: RecentActivitySectionProps) {
  const { activities, loading, error } = useRecentActivities(projectId, 6);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0F2332]">Recent Activity</h2>
        <Link
          href={projectId ? `/projects/${projectId}/activity` : "#"}
          className="text-xs font-medium text-[#1D3F52] hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {loading && activities.length === 0 ? (
          <div className="px-6 py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#1D3F52]/50" />
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-8 text-sm text-[#0F2332]/60 text-center">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity._id}
              className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#1D3F52] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {activity.actor?.fullName?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0F2332]">
                  <span className="font-semibold">{activity.actor?.fullName ?? "Unknown"}</span>{" "}
                  {getActionLabel(activity)}{" "}
                  <span className="font-medium text-[#1D3F52]">
                    {activity.target?.itemName ?? "—"}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
