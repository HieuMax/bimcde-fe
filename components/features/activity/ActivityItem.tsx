import React, { useState } from "react";
import { IActivity } from "@/types/activity";
import { format } from "date-fns";
import {
  MessageSquare,
  Box,
  FileText,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { activityService } from "@/services/activity.service";
import { toast } from "sonner";

interface ActivityItemProps {
  activity: IActivity;
  onRefresh?: () => void;
}

// Helper: Chọn icon chính (Cột trái ngoài cùng)
const getMainIcon = (group: string, type: string) => {
  if (type === "RENAME") {
    // Tùy chọn: Dùng icon bút chì cho hành động đổi tên cho dễ nhận biết
    return <Pencil className="h-5 w-5 text-orange-500 fill-orange-50" />;
  }
  if (type.includes("COMMENT") || group === "TOPIC") {
    return <MessageSquare className="h-5 w-5 text-blue-600 fill-blue-100" />;
  }
  return <Box className="h-5 w-5 text-[#005F9E] fill-[#E6F4FF]" />;
};

// Helper: Format text hành động (Dùng cho các trường hợp mặc định)
const getActionDescription = (activity: IActivity) => {
  const { actionType, actionGroup } = activity;
  const type = actionType.replace(/_/g, " ").toLowerCase();

  if (actionGroup === "RELEASE" && actionType === "ADD_FILE") {
    return "Added file(s) to Release";
  }
  if (actionType === "CREATE") return `Created ${actionGroup.toLowerCase()}`;
  if (actionType === "DELETE") return `Deleted ${actionGroup.toLowerCase()}`;
  if (actionType === "UPDATE") return `Updated ${actionGroup.toLowerCase()}`;
  if (actionType === "RESTORE") return `Restored ${actionGroup.toLowerCase()}`;

  if (actionType === "COMMENT")
    return `Commented on ${actionGroup.toLowerCase()}`;

  return type; // Fallback
};

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  onRefresh,
}) => {
  const [restoring, setRestoring] = useState(false);
  const restoreStatus = (activity as IActivity & { restoreStatus?: string })
    .restoreStatus;
  const formattedDate = format(
    new Date(activity.createdAt),
    "MMM dd, yyyy hh:mm a",
  );

  const relatedItemName = activity.metaData?.relatedFileName;

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const currentUserId = "CURRENT_USER_ID"; // Thay thế bằng ID thật
      await activityService.restoreItem(
        activity.target.itemId,
        activity.target.itemModel as "File" | "Folder",
        currentUserId,
      );
      toast.success(`${activity.target.itemModel} restored successfully`);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore item. It might be permanently deleted.");
    } finally {
      setRestoring(false);
    }
  };

  // [NEW] Hàm render nội dung hành động để xử lý Rename đặc biệt
  const renderActionContent = () => {
    const { actionType, target, metaData } = activity;

    // Logic hiển thị đặc biệt cho RENAME
    if (actionType === "RENAME" && metaData?.oldName) {
      return (
        <div className="text-sm text-gray-500 mb-1 flex flex-wrap items-center gap-1">
          <span>renamed {target.itemModel.toLowerCase()}</span>

          {/* Tên cũ gạch ngang */}
          <span className="text-gray-400 line-through decoration-gray-400 decoration-1 mx-1">
            {metaData.oldName}
          </span>

          <span className="text-gray-400 text-xs">➔</span>

          {/* Tên mới (Link) */}
          <Link
            href="#"
            className="text-[#005F9E] hover:underline font-medium ml-1"
          >
            {metaData.newName || target.itemName}
          </Link>
        </div>
      );
    }

    // Logic hiển thị mặc định cho các action khác
    return (
      <div className="text-sm text-gray-500 mb-1">
        {getActionDescription(activity)}{" "}
        <Link href="#" className="text-[#005F9E] hover:underline font-medium">
          {activity.target.itemName}
        </Link>
      </div>
    );
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group bg-white">
      {/* Cột 1: Main Icon */}
      <div className="pt-1">
        {getMainIcon(activity.actionGroup, activity.actionType)}
      </div>

      {/* Cột 2: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700">
              {activity.actor.fullName
                ? activity.actor.fullName.substring(0, 2).toUpperCase()
                : "??"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-gray-900">
            {activity.actor.fullName}
          </span>

          {/* Nút Restore / Trạng thái Restored */}
          {restoreStatus === "RESTORABLE" && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 ml-2"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Restore
            </Button>
          )}
          {restoreStatus === "RESTORED" && (
            <span className="flex items-center text-xs text-gray-400 italic ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
              Restored
            </span>
          )}
        </div>

        {/* Action Text (Sử dụng hàm render mới) */}
        {renderActionContent()}

        {/* Attachment / Related Item */}
        {relatedItemName && (
          <div className="flex items-center gap-2 mt-1 p-1">
            <FileText className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-[#005F9E] hover:underline cursor-pointer">
              {relatedItemName}
            </span>
          </div>
        )}

        {/* Description / Comment content */}
        {activity.description &&
          !relatedItemName &&
          activity.actionType !== "RENAME" && ( // Ẩn description mặc định của rename vì ta đã render custom text
            <p className="text-xs text-gray-500 mt-1 italic pl-1 border-l-2 border-gray-200">
              {activity.description}
            </p>
          )}
      </div>

      {/* Cột 3: Date */}
      <div className="text-xs text-gray-400 whitespace-nowrap pt-1 font-normal">
        {formattedDate}
      </div>
    </div>
  );
};
