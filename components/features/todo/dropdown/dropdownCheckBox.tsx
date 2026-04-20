import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  activityFilterChevronDownClassName,
  activityFilterCountBadgeClassName,
  activityFilterTriggerClassName,
} from "@/components/features/activity/activity-filter-ui";
import { cn } from "@/lib/utils";

type DropdownItem = {
  name: string;
  value?: string;
  checked?: boolean;
  className?: string;
  subLabel?: string;
  color?: string;
  id?: string | number;
  _id?: string | number;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
};

type DropdownProps = {
  options: DropdownItem[];
  isSearch: boolean;
  title: string;
  value?: string[] | Array<{ name: string; value?: string }>;
  onChange?: (selectedValues: any) => void;
  returnObject?: boolean; // If true, returns objects instead of strings
};

const DropDownCheckBox = ({ 
  options, 
  isSearch, 
  title, 
  value = [], 
  onChange,
  returnObject = false 
}: DropdownProps) => {
  const [search, setSearch] = useState("");
  
  // Normalize value to handle both string[] and object[] formats
  const normalizeValue = (val: typeof value) => {
    if (returnObject) {
      // If returnObject is true, expect object array
      return Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' 
        ? val as Array<{ name: string; value?: string }>
        : [];
    } else {
      // If returnObject is false, expect string array
      return Array.isArray(val) && val.length > 0 && typeof val[0] === 'string'
        ? val as string[]
        : [];
    }
  };

  const [selectedValues, setSelectedValues] = useState<typeof value>(normalizeValue(value));

  useEffect(() => {
    setSelectedValues(normalizeValue(value));
  }, [value]);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckedChange = (option: DropdownItem, checked: boolean) => {
    if (returnObject) {
      // Return object format
      const currentValues = normalizeValue(selectedValues) as Array<{ name: string; value?: string }>;
      const newSelectedValues = checked
        ? [...currentValues, { name: option.name, value: option.value }]
        : currentValues.filter((val) => val.name !== option.name);
      
      setSelectedValues(newSelectedValues);
      onChange?.(newSelectedValues);
    } else {
      // Return string format (backward compatible)
      const currentValues = normalizeValue(selectedValues) as string[];
      const newSelectedValues = checked
        ? [...currentValues, option.name]
        : currentValues.filter((val) => val !== option.name);
      
      setSelectedValues(newSelectedValues);
      onChange?.(newSelectedValues);
    }
  };

  const getOptionId = (option: DropdownItem, index: number): string => {
    return option.id?.toString() || option._id?.toString() || option.name || `option-${index}`;
  };

  const selectionCount = returnObject
    ? (normalizeValue(selectedValues) as Array<{ name: string; value?: string }>)
        .length
    : (normalizeValue(selectedValues) as string[]).length;

  const isActive = selectionCount > 0;

  const isOptionChecked = (option: DropdownItem): boolean => {
    if (returnObject) {
      const currentValues = normalizeValue(selectedValues) as Array<{ name: string; value?: string }>;
      return currentValues.some((val) => val.name === option.name);
    } else {
      const currentValues = normalizeValue(selectedValues) as string[];
      return currentValues.includes(option.name);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={activityFilterTriggerClassName(isActive)}
        >
          <span>{title}</span>
          {isActive && (
            <span className={activityFilterCountBadgeClassName}>
              {selectionCount}
            </span>
          )}
          <ChevronDown className={activityFilterChevronDownClassName} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="start"
        className={cn(
          "w-[280px] max-h-[400px] overflow-y-auto border border-gray-100 bg-white p-0 py-2 shadow-md",
        )}
      >
        {isSearch && (
          <div className="border-b border-gray-100 px-2 pb-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-gray-200 text-sm"
            />
          </div>
        )}

        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
        ) : (
          filteredOptions.map((option, index) => {
            const optionId = getOptionId(option, index);
            const isChecked = isOptionChecked(option);
            return (
              <div
                key={optionId}
                className="flex cursor-pointer items-center gap-3 px-2 py-2 hover:bg-gray-50"
              >
                <Checkbox
                  id={`checkbox-${optionId}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCheckedChange(option, !!checked)}
                />
                <Label
                  className="cursor-pointer flex flex-col h-12 leading-12 justify-center w-full"
                  htmlFor={`checkbox-${optionId}`}>
                  <span className="flex items-center gap-2 ">
                    {option.color && (
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          backgroundColor: option.color,
                        }}></div>
                    )}

                    {option.name}
                  </span>
                  <span className="text-gray-500 text-sm">{option.subLabel}</span>
                </Label>
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropDownCheckBox;
