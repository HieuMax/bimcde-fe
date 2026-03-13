import React from "react";
import { ReleasePageClient } from "@/components/features/release/ReleasePageClient";

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7] w-full">
      <div className="flex-1 min-h-0 w-full">
        <ReleasePageClient projectId={projectId} />
      </div>
    </div>
  );
}
