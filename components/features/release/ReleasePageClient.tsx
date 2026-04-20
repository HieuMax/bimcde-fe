"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ReleaseList } from "./ReleaseList";
import { CreateReleaseDialog } from "./CreateReleaseDialog";
import { useApi } from "@/app/hooks/useApi";
import {
  canCreateReleaseForProject,
  parseProjectReleaseContext,
  type ProjectReleaseContext,
} from "./releaseProjectContext";

interface ReleasePageClientProps {
  projectId: string;
}

export const ReleasePageClient: React.FC<ReleasePageClientProps> = ({
  projectId,
}) => {
  const { get } = useApi();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectCtx, setProjectCtx] = useState<ProjectReleaseContext | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await get(`/projects/getProject/${projectId}`);
        const raw = res?.success ? res.result : res;
        if (cancelled) return;
        setProjectCtx(parseProjectReleaseContext(raw));
      } catch {
        if (!cancelled) setProjectCtx(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit `get`: useApi() returns a new object each render, so listing
    // `get` here would retrigger this effect forever.
  }, [projectId]);

  const canCreateRelease = useMemo(
    () => canCreateReleaseForProject(projectCtx),
    [projectCtx],
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <ReleaseList
        key={refreshKey}
        projectId={projectId}
        projectReleaseContext={projectCtx}
        canCreateRelease={canCreateRelease}
        onCreateRelease={() => {
          if (canCreateRelease) setIsCreateOpen(true);
        }}
      />

      <CreateReleaseDialog
        projectId={projectId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
