"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IFile, IFolder } from "@/types/explorer";
import { IActivity } from "@/types/activity";
import { activityService } from "@/services/activity.service";
import { toast } from "sonner";

interface Props {
  item: IFile | IFolder;
  projectId: string;
  onBack: () => void;
  onClose: () => void;
}

function getActivitySummary(activity: IActivity): string {
  const { actionType, actionGroup, target, description, metaData } = activity;
  if (description?.trim()) return description.trim();

  if (actionType === "RENAME" && metaData?.oldName) {
    return `Renamed ${target.itemModel.toLowerCase()} from "${metaData.oldName}" to "${metaData.newName ?? target.itemName}"`;
  }
  if (actionGroup === "RELEASE" && actionType === "ADD_FILE") {
    return `Added file(s) to Release — ${target.itemName}`;
  }
  if (actionType === "CREATE") return `Created ${actionGroup.toLowerCase()}: ${target.itemName}`;
  if (actionType === "DELETE") return `Deleted ${actionGroup.toLowerCase()}: ${target.itemName}`;
  if (actionType === "UPDATE") return `Updated ${actionGroup.toLowerCase()}: ${target.itemName}`;
  if (actionType === "RESTORE") return `Restored ${actionGroup.toLowerCase()}: ${target.itemName}`;
  if (actionType === "COMMENT")
    return `Commented on ${actionGroup.toLowerCase()}: ${target.itemName}`;

  const human = actionType.replace(/_/g, " ").toLowerCase();
  return `${human} — ${target.itemName}`;
}

function ResourceLink({
  activity,
  projectId,
}: {
  activity: IActivity;
  projectId: string;
}) {
  const name = activity.target.itemName;
  if (activity.target.itemModel === "File") {
    const folderId = activity.fileFolderId;
    if (!folderId) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <FileText className="h-4 w-4 shrink-0" />
          {name}
        </span>
      );
    }
    return (
      <Link
        href={`/projects/${projectId}/data/folder?folderId=${folderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#005F9E] hover:underline"
      >
        <FileText className="h-4 w-4 shrink-0" />
        {name}
      </Link>
    );
  }
  if (activity.target.itemModel === "Folder") {
    return (
      <Link
        href={`/projects/${projectId}/data/folder?folderId=${activity.target.itemId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#005F9E] hover:underline"
      >
        <FileText className="h-4 w-4 shrink-0" />
        {name}
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <FileText className="h-4 w-4 shrink-0" />
      {name}
    </span>
  );
}

export default function ActivitiesView({ item, projectId, onBack, onClose }: Props) {
  const isFile = "mimeType" in item;
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const res = await activityService.getActivitiesForItem({
          projectId,
          ...(isFile ? { fileId: item._id } : { folderId: item._id }),
          page: nextPage,
          limit: 20,
        });

        if (append) {
          setActivities((prev) => [...prev, ...res.data]);
        } else {
          setActivities(res.data);
        }
        setHasMore(res.page < res.totalPages);
        setPage(nextPage);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load activity");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, item._id, isFile],
  );

  useEffect(() => {
    setPage(1);
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchPage(page + 1, true);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 shrink-0 -ml-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-medium text-foreground truncate">Activity</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!loading &&
            activities.map((act) => {
              const dateStr = format(new Date(act.createdAt), "MMM dd, yyyy hh:mm a");
              const displayName =
                act.actor.fullName?.trim() ||
                act.actor.email?.trim() ||
                "Anonymous User";
              const subtitle = act.actor.email?.trim() || "—";

              return (
                <div
                  key={act._id}
                  className="border-b border-gray-100 px-4 py-4 space-y-2 bg-white"
                >
                  <p className="text-xs text-gray-400">{dateStr}</p>
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">{subtitle}</p>
                      <p className="text-sm text-gray-700 pt-1">{getActivitySummary(act)}</p>
                      <div className="pt-1">
                        <ResourceLink activity={act} projectId={projectId} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {!loading && activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12 px-4">
              No activity recorded for this {isFile ? "file" : "folder"} yet.
            </p>
          )}

          {!loading && hasMore && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#005F9E] hover:text-[#004a7a] hover:underline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "See more activities"
                )}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
