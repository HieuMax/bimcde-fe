"use client";

import React, { useState } from "react";
import { ReleaseList } from "./ReleaseList";
import { CreateReleaseDialog } from "./CreateReleaseDialog";

interface ReleasePageClientProps {
  projectId: string;
}

export const ReleasePageClient: React.FC<ReleasePageClientProps> = ({
  projectId,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <ReleaseList
        key={refreshKey}
        projectId={projectId}
        onCreateRelease={() => setIsCreateOpen(true)}
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