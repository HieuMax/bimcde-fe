"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/app/hooks/useApi";
import { ITagTodo } from "@/types/todo3d";



interface TagSelectorProps {
  projectId: string;
  initialOptions?: ITagTodo[];
  onChange: (selectedIds: string[], selectedOptions?: ITagTodo[]) => void;
  disabled?: boolean;
}

export function TagSelector({
  projectId,
  initialOptions = [],
  onChange,
  disabled = false,
}: TagSelectorProps) {
  const api = useApi();

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const [availableOptions, setAvailableOptions] = React.useState<ITagTodo[]>(
    [],
  );
  const [selectedOptions, setSelectedOptions] =
    React.useState<ITagTodo[]>(initialOptions);

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setSelectedOptions(initialOptions);
  }, [initialOptions]);

  // Fetch tags
  React.useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/tags?projectId=${projectId}`);
        const tags = res?.result ?? res ?? [];
        const mapped: ITagTodo[] = tags.map((t: any) => ({
          tagId: t._id,
          name: t.name,
        }));

        setAvailableOptions(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [projectId, open]);

  // Select / unselect
  const handleSelect = (tag: ITagTodo) => {
    const isSelected = selectedOptions.some((item) => item.tagId === tag.tagId);

    let newSelected;

    if (isSelected) {
      newSelected = selectedOptions.filter((item) => item.tagId !== tag.tagId);
    } else {
      newSelected = [...selectedOptions, tag];
    }

    setSelectedOptions(newSelected);

    onChange(
      newSelected.map((item) => item.tagId),
      newSelected,
    );
  };

  // Remove tag
  const handleRemove = (tagId: string) => {
    const newSelected = selectedOptions.filter((item) => item.tagId !== tagId);

    setSelectedOptions(newSelected);

    onChange(
      newSelected.map((item) => item.tagId),
      newSelected,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1 min-h-[38px] p-1 border rounded-md bg-white items-center">
        {selectedOptions.length === 0 && (
          <span className="text-sm text-muted-foreground px-2 italic">
            No tags selected
          </span>
        )}

        {selectedOptions.map((tag) => (
          <Badge
            key={tag.tagId}
            variant="secondary"
            className="h-7 pr-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 gap-1">
            {tag.name}
            <button
              className="ml-1 rounded-full outline-none hover:bg-gray-300 p-0.5"
              onClick={() => handleRemove(tag.tagId)}>
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-muted-foreground font-normal bg-white"
            disabled={disabled}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </span>
            ) : (
              "Add tags..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[318px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={inputValue}
              onValueChange={setInputValue}
            />

            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>

              <CommandGroup>
                {availableOptions.map((tag) => {
                  const isSelected = selectedOptions.some(
                    (s) => s.tagId === tag.tagId,
                  );

                  return (
                    <CommandItem
                      key={tag.tagId}
                      value={tag.name}
                      onSelect={() => handleSelect(tag)}
                      className="cursor-pointer">
                      <span className="flex-1">{tag.name}</span>

                      {isSelected && (
                        <Check className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
