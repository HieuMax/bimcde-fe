import React from "react";
import { ReleaseDetailPageClient } from "@/components/features/release/ReleaseDetailPageClient";

interface PageProps {
  params: Promise<{
    projectId: string;
    releaseId: string;
  }>;
}

export default async function ReleaseDetailPage({ params }: PageProps) {
  const { projectId, releaseId } = await params;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7] w-full">
       <div className="flex-1 min-h-0 w-full">
        <ReleaseDetailPageClient projectId={projectId} releaseId={releaseId} />
      </div>
    </div>
  );
}
