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

interface User {
  userId: string;
  fullName: string;
  email: string;
}

interface UserFilterProps {
  projectId: string;
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  projectId,
  selectedUserIds,
  onChange,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Trigger style giống cái dropdown Activity Type
  const triggerStyle =
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm text-gray-600 hover:text-black px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors flex items-center";

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={triggerStyle}>
          <span>Users</span>
          {/* Hiển thị số lượng đang chọn nếu có */}
          {selectedUserIds.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] px-1.5 rounded-full">
              {selectedUserIds.length}
            </span>
          )}
          <ChevronDown className="w-4 h-4s text-gray-400" />
        </Button>
      </PopoverTrigger>

      {/* Width 300px để giống ảnh */}
      <PopoverContent className="w-[320px] p-0" align="start">
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
