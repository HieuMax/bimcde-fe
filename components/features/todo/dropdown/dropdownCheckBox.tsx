import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

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

  const getDisplayTitle = () => {
    const count = returnObject 
      ? (normalizeValue(selectedValues) as Array<{ name: string; value?: string }>).length
      : (normalizeValue(selectedValues) as string[]).length;
    
    if (count === 0) return title;
    if (count === 1) return `${title} (1)`;
    return `${title} (${count})`;
  };

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
        <Button className="bg-transparent hover:bg-gray-100 hover:shadow-sm text-gray-700 shadow-none focus-visible:ring-0 text-base">
          {getDisplayTitle()} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="start"
        className="py-4 px-4 max-w-xs min-w-64">
        {isSearch && (
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 p-2 text-sm border border-gray-300 rounded"
          />
        )}

        <DropdownMenuSeparator />

        {filteredOptions.length === 0 ? (
          <div className="text-gray-500 py-2 px-3">No results found</div>
        ) : (
          filteredOptions.map((option, index) => {
            const optionId = getOptionId(option, index);
            const isChecked = isOptionChecked(option);
            return (
              <div
                key={optionId}
                className="flex items-center gap-3 hover:bg-gray-100  px-3 cursor-pointer">
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
