"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, User, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/app/hooks/useApi";
import { IAssigneeTodo } from "@/types/todo3d";


interface AssignedSelectorProps {
  projectId: string;
  initialOptions?: IAssigneeTodo[];
  onChange: (selectedIds: string[], selectedOptions?: IAssigneeTodo[]) => void;
  disabled?: boolean;
}

export function AssignedSelector({
  projectId,
  initialOptions = [],
  onChange,
  disabled = false,
}: AssignedSelectorProps) {
  const api = useApi();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Danh sách options để chọn (từ API)
  const [availableOptions, setAvailableOptions] = React.useState<
    IAssigneeTodo[]
  >([]);

  // Khởi tạo state trực tiếp từ initialOptions
  const [selectedOptions, setSelectedOptions] =
    React.useState<IAssigneeTodo[]>(initialOptions);

  const [loading, setLoading] = React.useState(false);

  // Sync nếu initialOptions thay đổi từ bên ngoài
  React.useEffect(() => {
    if (initialOptions) {
      setSelectedOptions((prev) => {
        const prevIds = prev.map((p) => p.assigneeId).sort().join(',');
        const newIds = initialOptions.map((n) => n.assigneeId).sort().join(',');
        if (prevIds === newIds) return prev;
        return initialOptions;
      });
    }
  }, [initialOptions]);

  // Fetch Data (Users & Groups) để gợi ý tìm kiếm
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [membersRes, groupsRes] = await Promise.all([
          api.get(`/projects/${projectId}/members`),
          api.get(`/team/getGroup/${projectId}`),
        ]);

        const nextOptions: IAssigneeTodo[] = [];

        const members = membersRes.result || [];
        members.forEach((m: any) => {
          if (m.userId) {
            nextOptions.push({
              assigneeId: m.userId,
              name: m.fullName,
              type: "user",
              label: m.email,
            });
          }
        });

        const groups = groupsRes.result || [];
        groups.forEach((g: any) => {
          nextOptions.push({
            assigneeId: g._id,
            name: g.name,
            type: "group",
            label: g.name,
          });
        });

        setAvailableOptions(nextOptions);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const mapToIAssigness = (items: IAssigneeTodo[]): IAssigneeTodo[] => {
    return items.map((item) => ({
      assigneeId: item.assigneeId,
      type: item.type,
      name: item.name,
      label: item.type === "user" ? item.label : item.name,
    }));
  };

  const handleSelect = (option: IAssigneeTodo) => {
    const isSelected = selectedOptions.some(
      (item) => item.assigneeId === option.assigneeId,
    );

    let newSelected;

    if (isSelected) {
      newSelected = selectedOptions.filter(
        (item) => item.assigneeId !== option.assigneeId,
      );
    } else {
      newSelected = [...selectedOptions, option];
    }

    setSelectedOptions(newSelected);

    onChange(
      newSelected.map((item) => item.assigneeId),
      mapToIAssigness(newSelected),
    );
  };

  const handleRemove = (idToRemove: string) => {
    const newSelected = selectedOptions.filter(
      (item) => item.assigneeId !== idToRemove,
    );

    setSelectedOptions(newSelected);

    onChange(
      newSelected.map((item) => item.assigneeId),
      newSelected,
    );
  };

  const userOptions = availableOptions.filter((opt) => opt.type === "user");
  const groupOptions = availableOptions.filter((opt) => opt.type === "group");

  return (
    <div className="flex flex-col gap-2">
      {/* Vùng hiển thị Tags */}
      <div className="flex flex-wrap gap-1 min-h-[38px] p-1 border rounded-md bg-white items-center focus-within:ring-1 focus-within:ring-ring">
        {selectedOptions.length === 0 && (
          <span className="text-sm text-muted-foreground px-2 italic">
            No assignees selected
          </span>
        )}

        {selectedOptions.map((option) => (
          <Badge
            key={option.assigneeId}
            variant="secondary"
            className="h-7 pr-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 gap-1">
            {option.type === "group" ? (
              <Users className="h-3 w-3" />
            ) : (
              <User className="h-3 w-3" />
            )}
            {option.type === "user" ? option.name : option.label}
            <button
              className="ml-1 rounded-full outline-none hover:bg-gray-300 p-0.5"
              onClick={() => handleRemove(option.assigneeId)}>
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Dropdown tìm kiếm */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-muted-foreground font-normal bg-white "
            disabled={disabled}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </span>
            ) : (
              "Add assignee or group..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[318px] p-0" align="start">
          <Command shouldFilter={true}>
            <CommandInput
              placeholder="Begin typing to search..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {groupOptions.length > 0 && (
                <CommandGroup heading="Groups">
                  {groupOptions.map((option) => {
                    const isSelected = selectedOptions.some(
                      (s) => s.assigneeId === option.assigneeId,
                    );
                    return (
                      <CommandItem
                        key={option.assigneeId}
                        value={option.label + " group"}
                        onSelect={() => handleSelect(option)}
                        className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4 text-blue-500" />
                        <span className="flex-1">{option.label}</span>
                        {isSelected && (
                          <Check className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {groupOptions.length > 0 && userOptions.length > 0 && (
                <CommandSeparator />
              )}

              {userOptions.length > 0 && (
                <CommandGroup heading="Users">
                  {userOptions.map((option) => {
                    const isSelected = selectedOptions.some(
                      (s) => s.assigneeId === option.assigneeId,
                    );
                    return (
                      <CommandItem
                        key={option.assigneeId}
                        value={option.name + " " + option.label}
                        onSelect={() => handleSelect(option)}
                        className="cursor-pointer">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        <div className="flex flex-col">
                          <span>{option.name}</span>
                          {option.label && (
                            <span className="text-xs text-gray-400">
                              {option.label}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
