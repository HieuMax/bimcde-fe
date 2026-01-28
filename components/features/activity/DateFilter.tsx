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
import { ChevronDown } from "lucide-react";

interface DateFilterProps {
  onFilterChange: (range: { startDate?: Date; endDate?: Date }) => void;
}

interface RadioItemProps {
  label: string;
  value: PresetType;
  checked: boolean;
  onSelect: (value: PresetType) => void;
}

type PresetType = "today" | "yesterday" | "past7" | "past30" | "custom" | null;

const RadioItem: React.FC<RadioItemProps> = ({
  label,
  value,
  checked,
  onSelect,
}) => {
  return (
    <div
      className="flex items-center gap-3 py-2 cursor-pointer group"
      onClick={() => onSelect(value)}
    >
      <div
        className={cn(
          "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
          checked
            ? "border-[#005F9E]"
            : "border-gray-300 group-hover:border-gray-400"
        )}
      >
        {checked && <div className="h-2.5 w-2.5 rounded-full bg-[#005F9E]" />}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
};

export const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // State cho việc mở rộng vùng Custom Date (nút +)
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);

  // State lưu lựa chọn hiện tại
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(null);

  // State lưu ngày custom
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  // State lịch nhỏ popup cho From/To input
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  // Style giống các filter khác
  const triggerStyle =
    "border-0 shadow-none focus:ring-0 w-auto gap-2 font-medium text-sm text-gray-600 hover:text-black px-2 h-8 data-[state=open]:bg-gray-100 rounded-md transition-colors flex items-center";

  // Hàm xử lý khi chọn Preset (Today, Yesterday...)
  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    setIsCustomExpanded(false); // Thu gọn custom date khi chọn preset

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

    // Reset custom inputs hiển thị
    setFromDate(undefined);
    setToDate(undefined);

    // Gửi dữ liệu ra ngoài
    onFilterChange({ startDate: start, endDate: end });
    // setIsOpen(false); // Đóng popover sau khi chọn
  };

  // Hàm xử lý khi chọn Custom Date
  const handleCustomDateChange = (
    type: "from" | "to",
    date: Date | undefined
  ) => {
    setSelectedPreset("custom"); // Chuyển radio sang trạng thái custom (hoặc bỏ chọn preset)

    let newFrom = fromDate;
    let newTo = toDate;

    if (type === "from") {
      newFrom = date;
      setFromDate(date);
      setIsFromCalendarOpen(false);
    } else {
      newTo = date;
      setToDate(date);
      setIsToCalendarOpen(false);
    }

    // Chỉ gửi filter khi cả 2 ngày đã được chọn (hoặc tùy logic bạn muốn gửi ngay)
    if (newFrom && newTo) {
      onFilterChange({
        startDate: startOfDay(newFrom),
        endDate: endOfDay(newTo),
      });
    }
  };

  // Hàm Reset
  const handleReset = () => {
    setSelectedPreset(null);
    setFromDate(undefined);
    setToDate(undefined);
    setIsCustomExpanded(false);
    onFilterChange({ startDate: undefined, endDate: undefined });
    setIsOpen(false);
  };

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
        if (fromDate && toDate) {
          // Hiển thị khoảng ngày nếu chọn Custom (vd: 01/01/24 - 05/01/24)
          return `${format(fromDate, "MM/dd/yyyy")} - ${format(
            toDate,
            "MM/dd/yyyy"
          )}`;
        }
        return "Custom Date";
      default:
        return "Date modified"; // Mặc định
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={triggerStyle}>
          <span>{getFilterLabel()}</span>
          <ChevronDown className="w-4 h-4s text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0 bg-white" align="start">
        <div className="flex flex-col">
          {/* --- SECTION: CUSTOM DATE --- */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Custom Date
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-black"
                onClick={() => setIsCustomExpanded(!isCustomExpanded)}
              >
                {isCustomExpanded ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Expandable Inputs */}
            {isCustomExpanded && (
              <div className="space-y-3 mt-2 animate-in slide-in-from-top-2 duration-200">
                {/* FROM INPUT */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">From</label>
                  <Popover
                    open={isFromCalendarOpen}
                    onOpenChange={setIsFromCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-9 justify-between text-left font-normal border-gray-300 hover:bg-white px-3",
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
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
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

                {/* TO INPUT */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">To</label>
                  <Popover
                    open={isToCalendarOpen}
                    onOpenChange={setIsToCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-9 justify-between text-left font-normal border-gray-300 hover:bg-white px-3",
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
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={(date) => handleCustomDateChange("to", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* --- SECTION: PRESETS --- */}
          <div className="p-4 pt-2">
            <RadioItem
              label="Today"
              value="today"
              checked={selectedPreset === "today"}
              onSelect={handleSelectPreset}
            />
            <RadioItem
              label="Yesterday"
              value="yesterday"
              checked={selectedPreset === "yesterday"}
              onSelect={handleSelectPreset}
            />
            <RadioItem
              label="Past 7 days"
              value="past7"
              checked={selectedPreset === "past7"}
              onSelect={handleSelectPreset}
            />
            <RadioItem
              label="Past 30 days"
              value="past30"
              checked={selectedPreset === "past30"}
              onSelect={handleSelectPreset}
            />
          </div>

          {/* --- FOOTER: RESET --- */}
          <div className="p-3 pt-0">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-black hover:bg-transparent px-0 font-semibold h-auto"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
