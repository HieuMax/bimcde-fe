import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  label?: string;
  hideCustom?: boolean;
  onFilterChange: (range: { startDate?: Date; endDate?: Date }) => void;
}

type PresetType = "today" | "yesterday" | "past7" | "past30" | "custom" | null;

export const DateFilter: React.FC<DateFilterProps> = ({
  label = "Date modified",
  hideCustom = false,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  const getFilterLabel = () => {
    switch (selectedPreset) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "past7":
        return "Past 7 days";
      case "past30":
        return "Past 30 days";
      case "custom":
        if (fromDate && toDate)
          return `${format(fromDate, "MM/dd/yyyy")} - ${format(
            toDate,
            "MM/dd/yyyy"
          )}`;
        return "Custom Date";
      default:
        return label;
    }
  };

  const isActive = selectedPreset !== null;

  const triggerStyle = cn(
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors flex items-center",
    isActive ? "text-[#005F9E] font-semibold" : "text-gray-600 hover:text-black"
  );

  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    setIsCustomExpanded(false);

    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (preset) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "yesterday":
        const yesterday = subDays(now, 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case "past7":
        start = startOfDay(subDays(now, 7));
        end = endOfDay(now);
        break;
      case "past30":
        start = startOfDay(subDays(now, 30));
        end = endOfDay(now);
        break;
      default:
        return;
    }

    setFromDate(undefined);
    setToDate(undefined);
    onFilterChange({ startDate: start, endDate: end });
    setIsOpen(false);
  };

  const handleCustomDateChange = (
    type: "from" | "to",
    date: Date | undefined
  ) => {
    setSelectedPreset("custom");
    let newFrom = type === "from" ? date : fromDate;
    let newTo = type === "to" ? date : toDate;

    if (type === "from") {
      setFromDate(date);
      setIsFromCalendarOpen(false);
    } else {
      setToDate(date);
      setIsToCalendarOpen(false);
    }

    if (newFrom && newTo) {
      onFilterChange({
        startDate: startOfDay(newFrom),
        endDate: endOfDay(newTo),
      });
    }
  };

  const handleReset = () => {
    setSelectedPreset(null);
    setFromDate(undefined);
    setToDate(undefined);
    setIsCustomExpanded(false);
    onFilterChange({ startDate: undefined, endDate: undefined });
    setIsOpen(false);
  };

  const RadioItem = ({
    label,
    value,
    checked,
  }: {
    label: string;
    value: PresetType;
    checked: boolean;
  }) => (
    <div
      className="flex items-center gap-3 py-2 cursor-pointer group"
      onClick={() => handleSelectPreset(value)}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-full border flex items-center justify-center transition-colors mt-0.5",
          checked
            ? "border-[#005F9E]"
            : "border-gray-400 group-hover:border-gray-500"
        )}
      >
        {checked && <div className="h-2 w-2 rounded-full bg-[#005F9E]" />}
      </div>
      <span
        className={cn(
          "text-sm",
          checked ? "text-[#005F9E] font-medium" : "text-gray-700"
        )}
      >
        {label}
      </span>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={triggerStyle}>
          <span>{getFilterLabel()}</span>
          {isActive && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#005F9E]" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-0 bg-white shadow-lg border border-gray-200"
        align="start"
      >
        <div className="flex flex-col">
          {/* Custom Date Section (Chỉ hiện khi hideCustom = false) */}
          {!hideCustom && (
            <>
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Custom Date
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-gray-400 hover:text-black hover:bg-gray-100"
                    onClick={() => setIsCustomExpanded(!isCustomExpanded)}
                  >
                    {isCustomExpanded ? (
                      <Minus className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {isCustomExpanded && (
                  <div className="space-y-3 mt-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 ml-1">From</label>
                      <Popover
                        open={isFromCalendarOpen}
                        onOpenChange={setIsFromCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-8 justify-between text-left font-normal border-gray-300 hover:bg-white px-2 text-sm",
                              !fromDate && "text-muted-foreground"
                            )}
                          >
                            {fromDate ? (
                              format(fromDate, "MM-dd-yyyy")
                            ) : (
                              <span className="text-gray-400 italic">
                                mm-dd-yyyy
                              </span>
                            )}
                            <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={(date) =>
                              handleCustomDateChange("from", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 ml-1">To</label>
                      <Popover
                        open={isToCalendarOpen}
                        onOpenChange={setIsToCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-8 justify-between text-left font-normal border-gray-300 hover:bg-white px-2 text-sm",
                              !toDate && "text-muted-foreground"
                            )}
                          >
                            {toDate ? (
                              format(toDate, "MM-dd-yyyy")
                            ) : (
                              <span className="text-gray-400 italic">
                                mm-dd-yyyy
                              </span>
                            )}
                            <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={(date) =>
                              handleCustomDateChange("to", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-[1px] bg-gray-100 w-full" />
            </>
          )}

          {/* Presets List */}
          <div className="p-4 pt-2">
            <RadioItem
              label="Today"
              value="today"
              checked={selectedPreset === "today"}
            />
            <RadioItem
              label="Yesterday"
              value="yesterday"
              checked={selectedPreset === "yesterday"}
            />
            <RadioItem
              label="Past 7 days"
              value="past7"
              checked={selectedPreset === "past7"}
            />
            <RadioItem
              label="Past 30 days"
              value="past30"
              checked={selectedPreset === "past30"}
            />
          </div>

          <div className="p-3 pt-0 pb-3 pl-4">
            <span
              className="text-sm font-semibold text-gray-600 hover:text-black cursor-pointer select-none"
              onClick={handleReset}
            >
              Reset
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
