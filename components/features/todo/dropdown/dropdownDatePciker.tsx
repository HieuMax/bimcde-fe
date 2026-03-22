"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DropdownItem = {
  label: string;
  value: string;
};

type DropdownProps = {
  title: string;
  options: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  from?: Date | null;
  to?: Date | null;
  onRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
};

const DropdownDatePicker = ({
  title,
  options,
  value,
  onChange,
  from,
  to,
  onRangeChange,
}: DropdownProps) => {
  const [isCustomDate, setIsCustomDate] = useState(false);

  const toggleCustomDate = () => {
    setIsCustomDate((prev) => !prev);
  };

  const handleRangeChange = (key: "from" | "to", date: Date | undefined) => {
    const next = {
      from: key === "from" ? (date ?? null) : from ?? null,
      to: key === "to" ? (date ?? null) : to ?? null,
    };

    // Clear quick option when using custom range
    if (value) {
      onChange("");
    }

    onRangeChange?.(next);
  };

  return (
    <DropdownMenu onOpenChange={(open) => !open && setIsCustomDate(false)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-gray-700 text-base gap-1">
          {title}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-[280px] p-0">
        {/* Custom Date header */}
        <div className="border-b px-3 py-3 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between text-gray-700 px-0"
            onClick={toggleCustomDate}>
            <span>Custom date range</span>
            <Plus className="h-4 w-4" />
          </Button>

          {isCustomDate && (
            <div className="mt-2 space-y-2">
              {/* From */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">From</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !from && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {from ? (
                        format(from, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={from ?? undefined}
                      onSelect={(date) => handleRangeChange("from", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !to && "text-muted-foreground"
                      )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {to ? format(to, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={to ?? undefined}
                      onSelect={(date) => handleRangeChange("to", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Radio options */}
        <RadioGroup value={value} onValueChange={onChange} className="py-2">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-3 hover:bg-gray-100  px-3 cursor-pointer">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="cursor-pointer h-10 leading-10">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div
          onClick={() => {
            onChange("");
            onRangeChange?.({ from: null, to: null });
          }}
          className="px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:underline">
          Reset
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownDatePicker;
