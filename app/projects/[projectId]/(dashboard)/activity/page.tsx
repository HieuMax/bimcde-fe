import React from "react";
import { ActivityFeed } from "@/components/features/activity/ActivityFeed";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    // Background màu xám nhạt cho toàn trang để làm nổi bật cái bảng trắng (như Trimble)
    <div className="flex flex-col h-full bg-[#F5F6F7] w-full">
      {/* Container chính full chiều cao */}
      <div className="flex-1 min-h-0 w-full ">
        <ActivityFeed projectId={projectId} />
      </div>
    </div>
  );
}
