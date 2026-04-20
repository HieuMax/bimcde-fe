import React, { useEffect, useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { activityService } from "@/services/activity.service";
import {
  activityFilterChevronDownClassName,
  activityFilterCountBadgeClassName,
  activityFilterPopoverContentClassName,
  activityFilterTriggerClassName,
} from "./activity-filter-ui";

interface User {
  userId: string;
  fullName: string;
  email: string;
}

interface UserFilterProps {
  projectId: string;
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  /** Label on the filter trigger (default: "Users") */
  triggerLabel?: string;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  projectId,
  selectedUserIds,
  onChange,
  triggerLabel = "Users",
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Gọi API Backend qua Service
      const res: any = await activityService.getProjectMembers(projectId);
      if (res.result) {
        setUsers(res.result);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to load members", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data khi mở popover lần đầu
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchMembers();
    }
  }, [isOpen]);

  // Logic lọc search client-side
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // Xử lý check/uncheck
  const handleToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const isActive = selectedUserIds.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={activityFilterTriggerClassName(isActive)}
        >
          <span>{triggerLabel}</span>
          {isActive && (
            <span className={activityFilterCountBadgeClassName}>
              {selectedUserIds.length}
            </span>
          )}
          <ChevronDown className={activityFilterChevronDownClassName} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={activityFilterPopoverContentClassName}
        align="start"
      >
        {/* Header: Search Box */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users"
              className="pl-9 bg-white border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Body: List Users */}
        <div className="max-h-[300px] overflow-y-auto py-1">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleToggle(user.userId)}
              >
                <Checkbox
                  checked={selectedUserIds.includes(user.userId)}
                  onCheckedChange={() => handleToggle(user.userId)}
                  className="mt-1 h-4 w-4 rounded-sm border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 leading-none mb-1">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-gray-400 font-normal">
                    {user.email}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Last Updated & Refresh */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 pl-1">
            Last Updated:{" "}
            {lastUpdated
              ? format(lastUpdated, "EEE, dd MMM yyyy HH:mm:ss 'GMT'")
              : "--"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-gray-200 rounded-full"
            onClick={fetchMembers}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-gray-500 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
