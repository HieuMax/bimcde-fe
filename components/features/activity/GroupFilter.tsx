import React, { useEffect, useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RefreshCw, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useApi } from "@/app/hooks/useApi";
import { cn } from "@/lib/utils";

interface Group {
  _id: string;
  name: string;
  memberCount: number;
}

interface GroupFilterProps {
  projectId: string;
  selectedGroupIds: string[];
  onChange: (groupIds: string[]) => void;
}

export const GroupFilter: React.FC<GroupFilterProps> = ({
  projectId,
  selectedGroupIds,
  onChange,
}) => {
  const api = useApi();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Trigger style giống các filter khác
  const triggerStyle =
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm text-gray-600 hover:text-black px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors flex items-center";

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách Group (đã có sẵn ở TeamController)
      const res: any = await api.get(`/team/getGroup/${projectId}`);
      // API backend trả về: { success: true, result: [...] }
      if (res.success && res.result) {
        setGroups(res.result);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && groups.length === 0) {
      fetchGroups();
    }
  }, [isOpen]);

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [groups, search]);

  const handleToggle = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onChange(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      onChange([...selectedGroupIds, groupId]);
    }
  };

  const isActive = selectedGroupIds.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            triggerStyle,
            isActive && "text-[#005F9E] font-semibold",
          )}
        >
          <span>Groups</span>
          {selectedGroupIds.length > 0 && (
            <span className="ml-1 bg-[#E6F4FF] text-[#005F9E] text-[10px] px-1.5 h-4 flex items-center justify-center rounded-full font-bold min-w-[1.25rem]">
              {selectedGroupIds.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[300px] p-0 bg-white shadow-lg border border-gray-200"
        align="start"
      >
        {/* Header: Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search groups"
              className="pl-9 bg-white border-gray-200 h-9 text-sm focus-visible:ring-1 focus-visible:ring-[#005F9E]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Body: List */}
        <div className="max-h-[250px] overflow-y-auto py-1">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" /> Loading groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No groups found
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group._id}
                className="flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleToggle(group._id)}
              >
                <Checkbox
                  id={group._id}
                  checked={selectedGroupIds.includes(group._id)}
                  onCheckedChange={() => handleToggle(group._id)}
                  className="border-gray-400 h-4 w-4 rounded-sm data-[state=checked]:bg-[#005F9E] data-[state=checked]:border-[#005F9E]"
                />
                <div className="flex flex-col cursor-pointer">
                  <label
                    htmlFor={group._id}
                    className="text-sm font-normal text-gray-700 leading-none cursor-pointer mb-1"
                  >
                    {group.name}
                  </label>
                  <span className="text-xs text-gray-400 font-normal">
                    {group.memberCount} users
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Last Updated */}
        <div className="border-t border-gray-100 bg-[#FAFAFA] p-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 pl-1">
            Last Updated:{" "}
            {lastUpdated
              ? format(lastUpdated, "EEE, dd MMM yyyy HH:mm:ss 'GMT'")
              : "--"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-gray-200 rounded-full"
            onClick={fetchGroups}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 text-gray-500",
                loading && "animate-spin",
              )}
            />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
