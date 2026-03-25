import React from "react";
import { TopicsPageClient } from "@/components/features/topics/TopicsPageClient";

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7] w-full">
      <div className="flex-1 min-h-0 w-full">
        <TopicsPageClient projectId={projectId} />
      </div>
    </div>
  );
}
