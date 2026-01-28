import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES_TREE } from "./activity-constants";

interface ActivityTypeFilterProps {
  onFilterChange: (selectedMap: Record<string, string[]>) => void;
}

export const ActivityTypeFilter: React.FC<ActivityTypeFilterProps> = ({
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // --- LOGIC HELPER ---
  const toggleExpand = (group: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const getGroupState = (groupIndex: number) => {
    const group = ACTIVITY_TYPES_TREE[groupIndex];
    const childrenKeys = group.children.map((c) => `${group.group}_${c.value}`);
    const selectedCount = childrenKeys.filter((k) =>
      selectedKeys.has(k)
    ).length;

    if (selectedCount === 0) return "unchecked";
    if (selectedCount === childrenKeys.length) return "checked";
    return "indeterminate";
  };

  const handleGroupToggle = (groupIndex: number) => {
    const group = ACTIVITY_TYPES_TREE[groupIndex];
    const childrenKeys = group.children.map((c) => `${group.group}_${c.value}`);
    const currentState = getGroupState(groupIndex);

    const newSelected = new Set(selectedKeys);

    if (currentState === "checked") {
      childrenKeys.forEach((k) => newSelected.delete(k));
    } else {
      childrenKeys.forEach((k) => newSelected.add(k));
    }

    setSelectedKeys(newSelected);
    emitChange(newSelected);
  };

  const handleChildToggle = (group: string, value: string) => {
    const key = `${group}_${value}`;
    const newSelected = new Set(selectedKeys);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedKeys(newSelected);
    emitChange(newSelected);
  };

  const emitChange = (currentSelected: Set<string>) => {
    const result: Record<string, string[]> = {};
    currentSelected.forEach((key) => {
      const [group, value] = key.split("_");
      if (!result[group]) result[group] = [];
      result[group].push(value);
    });
    onFilterChange(result);
  };

  const handleReset = () => {
    setSelectedKeys(new Set());
    onFilterChange({});
    setIsOpen(false);
  };

  // --- [NEW] Biến đếm số lượng đang chọn ---
  const selectedCount = selectedKeys.size;
  const isActive = selectedCount > 0;

  const triggerStyle = cn(
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors flex items-center",
    isActive ? "text-[#005F9E] font-semibold" : "text-gray-600 hover:text-black"
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={triggerStyle}>
          <span>Activity type</span>

          {/* --- [NEW] UI Hiển thị số lượng --- */}
          {selectedCount > 0 && (
            <span className="ml-1 bg-[#E6F4FF] text-[#005F9E] text-[10px] px-1.5 h-4 flex items-center justify-center rounded-full font-bold min-w-[1.25rem]">
              {selectedCount}
            </span>
          )}

          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0 bg-white" align="start">
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {ACTIVITY_TYPES_TREE.map((groupItem, index) => {
            const groupState = getGroupState(index);
            const isExpanded = expandedGroups.includes(groupItem.group);

            return (
              <div key={groupItem.group} className="select-none">
                <div className="flex items-center px-3 py-1.5 hover:bg-gray-50 group">
                  <div className="flex items-center h-5 w-5 mr-2 relative">
                    <Checkbox
                      checked={
                        groupState === "checked" ||
                        groupState === "indeterminate"
                      }
                      onCheckedChange={() => handleGroupToggle(index)}
                      className={cn(
                        "data-[state=checked]:bg-[#005F9E] data-[state=checked]:border-[#005F9E]",
                        groupState === "indeterminate" &&
                          "data-[state=checked]:bg-white data-[state=checked]:text-[#005F9E] border-[#005F9E]"
                      )}
                    >
                      {groupState === "indeterminate" && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="h-0.5 w-2.5 bg-[#005F9E]" />
                        </span>
                      )}
                    </Checkbox>
                  </div>

                  <div
                    className="cursor-pointer p-1 rounded-sm hover:bg-gray-200 mr-1"
                    onClick={(e) => toggleExpand(groupItem.group, e)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                  </div>

                  <span
                    className="text-sm text-gray-700 flex-1 cursor-default"
                    onClick={() => handleGroupToggle(index)}
                  >
                    {groupItem.label}
                  </span>
                </div>

                {isExpanded && (
                  <div className="pl-11 pr-3 pb-1 space-y-1">
                    {groupItem.children.map((child) => {
                      const childKey = `${groupItem.group}_${child.value}`;
                      const isChecked = selectedKeys.has(childKey);

                      return (
                        <div
                          key={child.value}
                          className="flex items-center py-1 hover:bg-gray-50 rounded-sm"
                        >
                          <Checkbox
                            className="mr-3 h-4 w-4 border-gray-300 data-[state=checked]:bg-[#005F9E] data-[state=checked]:border-[#005F9E]"
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleChildToggle(groupItem.group, child.value)
                            }
                          />
                          <span
                            className="text-sm text-gray-600 cursor-default"
                            onClick={() =>
                              handleChildToggle(groupItem.group, child.value)
                            }
                          >
                            {child.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isActive && (
          <div className="border-t border-gray-100 p-2">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs font-normal text-gray-500 hover:text-black justify-start px-2"
              onClick={handleReset}
            >
              Clear filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
