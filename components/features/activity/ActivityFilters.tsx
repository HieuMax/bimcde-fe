import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, RefreshCcw } from "lucide-react";
import { UserFilter } from "./UserFilter";
import { DateFilter } from "./DateFilter";
import { ActivityTypeFilter } from "./ActivityTypeFilter";
import { GroupFilter } from "./GroupFilter";

interface ActivityFiltersProps {
  projectId: string;
  onFilterChange: (filters: {
    actionGroup?: string;
    actionTypes?: string;
    userIds?: string[];
    groupIds?: string[];
    startDate?: string;
    endDate?: string;
  }) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  projectId,
  onFilterChange,
  onRefresh,
  isLoading,
}) => {
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);

  const handleUserChange = (userIds: string[]) => {
    setSelectedUserIds(userIds);
    onFilterChange({ userIds: userIds.length > 0 ? userIds : undefined });
  };

  const handleGroupChange = (groupIds: string[]) => {
    setSelectedGroupIds(groupIds);
    onFilterChange({
      // Cần truyền lại các giá trị cũ nếu muốn giữ state (tuỳ cách bạn implement onFilterChange ở cha)
      // Ở đây giả sử onFilterChange merge object
      groupIds: groupIds.length > 0 ? groupIds : undefined,
    });
  };

  const handleDateChange = (range: { startDate?: Date; endDate?: Date }) => {
    onFilterChange({
      startDate: range.startDate?.toISOString(),
      endDate: range.endDate?.toISOString(),
    });
  };

  const handleActivityTypeChange = (selectedMap: Record<string, string[]>) => {
    const groups = Object.keys(selectedMap);

    // Hiện tại giả sử ta sẽ gom hết Action Types lại thành 1 mảng phẳng
    const allTypes: string[] = [];
    groups.forEach((g) => {
      allTypes.push(...selectedMap[g]);
    });

    const actionGroup = groups.length > 0 ? groups.join(",") : undefined;

    const actionTypes = allTypes.length > 0 ? allTypes.join(",") : undefined;

    onFilterChange({
      actionGroup,
      actionTypes, // ✅ string CSV
    });
  };
  // Custom trigger style to match Trimble Connect (Text only, no border box)
  const triggerStyle =
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm text-gray-600 hover:text-black px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors";

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
      <div className="flex items-center gap-1">
        {/* Activity Type Filter */}
        <ActivityTypeFilter onFilterChange={handleActivityTypeChange} />

        <span className="text-gray-300">|</span>
        {/* Users Filter */}
        <UserFilter
          projectId={projectId}
          selectedUserIds={selectedUserIds}
          onChange={handleUserChange}
        />

        <span className="text-gray-300">|</span>

        {/* Groups Filter (Placeholder) */}
        <GroupFilter
          projectId={projectId}
          selectedGroupIds={selectedGroupIds}
          onChange={handleGroupChange}
        />

        <span className="text-gray-300">|</span>

        {/* Date Filter */}
        <DateFilter onFilterChange={handleDateChange} />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-gray-500 hover:text-black"
          title="Refresh"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-black"
          title="Export to Excel"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
