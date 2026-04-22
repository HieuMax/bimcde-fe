"use client";

import React, { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  activityFilterChevronDownClassName,
  activityFilterClearRowButtonClassName,
  activityFilterCountBadgeClassName,
  activityFilterPopoverContentClassName,
  activityFilterPopoverScrollClassName,
  activityFilterTriggerClassName,
} from "@/components/features/activity/activity-filter-ui";
import { cn } from "@/lib/utils";

export type TopicMatchMode = "atleast" | "any" | "all";

export type TopicFilterOption = {
  value: string;
  label: string;
  color?: string;
  icon?: string;
};

type MultiCheckboxFilterProps = {
  label: string;
  options: TopicFilterOption[];
  selectedValues: string[];
  onChange: (next: string[]) => void;
  renderOptionIcon?: (opt: TopicFilterOption) => React.ReactNode;
  placeholder?: string;
};

export function MultiCheckboxFilterPopover({
  label,
  options,
  selectedValues,
  onChange,
  renderOptionIcon,
  placeholder,
}: MultiCheckboxFilterProps) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const isActive = selectedValues.length > 0;

  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  const toggleAll = () => {
    if (selectedValues.length === options.length) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  const handleClearFilter = () => {
    onChange([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={activityFilterTriggerClassName(isActive)}
        >
          <span>
            {selectedValues.length === 0 ? (placeholder ?? label) : label}
          </span>
          {isActive && (
            <span className={activityFilterCountBadgeClassName}>
              {selectedValues.length}
            </span>
          )}
          <ChevronDown className={activityFilterChevronDownClassName} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={activityFilterPopoverContentClassName}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs font-normal text-gray-600 hover:text-black"
            onClick={toggleAll}
          >
            {selectedValues.length === options.length ? "Clear" : "Select all"}
          </Button>
        </div>

        <div className={cn(activityFilterPopoverScrollClassName, "px-1")}>
          {options.map((opt) => {
            const checked = selectedSet.has(opt.value);
            return (
              <div
                key={opt.value}
                className="flex cursor-default items-center rounded-sm px-3 py-1.5 hover:bg-gray-50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                  className="mr-3"
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {renderOptionIcon ? (
                    renderOptionIcon(opt)
                  ) : opt.color ? (
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border border-gray-200/80"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : null}
                  <span
                    className="cursor-default truncate text-sm text-gray-600"
                    onClick={() => toggle(opt.value)}
                  >
                    {opt.label}
                  </span>
                </div>
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="py-4 text-center text-sm text-gray-400">
              No options
            </div>
          )}
        </div>

        {isActive && (
          <div className="border-t border-gray-100 p-2">
            <Button
              variant="ghost"
              className={activityFilterClearRowButtonClassName}
              onClick={handleClearFilter}
            >
              Clear filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type DatePresetOption = { label: string; value: string };

type DateModifiedFilterPopoverProps = {
  label: string;
  options: DatePresetOption[];
  presetValue: string;
  onPresetChange: (value: string) => void;
  from?: Date | null;
  to?: Date | null;
  onRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
  placeholder?: string;
};

export function DateModifiedFilterPopover({
  label,
  options,
  presetValue,
  onPresetChange,
  from,
  to,
  onRangeChange,
  placeholder,
}: DateModifiedFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isCustomDate, setIsCustomDate] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setIsCustomDate(false);
  };

  const handleRangeChange = (key: "from" | "to", date: Date | undefined) => {
    const next = {
      from: key === "from" ? (date ?? null) : (from ?? null),
      to: key === "to" ? (date ?? null) : (to ?? null),
    };
    if (presetValue) onPresetChange("");
    onRangeChange?.(next);
  };

  const clearAll = () => {
    onPresetChange("");
    onRangeChange?.({ from: null, to: null });
  };

  const isActive = Boolean(presetValue) || Boolean(from || to);

  const triggerText = (() => {
    if (presetValue) {
      const opt = options.find((o) => o.value === presetValue);
      return opt?.label ?? label;
    }
    if (from && to) {
      return `${format(from, "MM/dd/yy")} – ${format(to, "MM/dd/yy")}`;
    }
    return placeholder ?? label;
  })();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={activityFilterTriggerClassName(isActive)}
        >
          <span>{triggerText}</span>
          <ChevronDown className={activityFilterChevronDownClassName} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={activityFilterPopoverContentClassName}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-2 py-2">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs font-normal text-gray-600 hover:text-black"
            onClick={clearAll}
          >
            Clear
          </Button>
        </div>

        <div className="border-b border-gray-100 px-2 py-2">
          <Button
            variant="ghost"
            className="h-8 w-full justify-between px-1 text-sm font-normal text-gray-700 hover:text-black"
            onClick={() => setIsCustomDate((v) => !v)}
          >
            <span>Custom date range</span>
            {isCustomDate ? (
              <Minus className="h-4 w-4 shrink-0" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" />
            )}
          </Button>

          {isCustomDate && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">From</span>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left text-sm font-normal",
                        !from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {from ? format(from, "PP") : <span>Pick a date</span>}
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
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">To</span>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left text-sm font-normal",
                        !to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {to ? format(to, "PP") : <span>Pick a date</span>}
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

        <div className={cn(activityFilterPopoverScrollClassName, "px-2")}>
          <RadioGroup
            value={presetValue}
            onValueChange={(v) => {
              onPresetChange(v);
            }}
            className="flex flex-col gap-0"
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-2 py-2">
                <RadioGroupItem
                  value={option.value}
                  id={`date_preset_${option.value}`}
                />
                <Label
                  htmlFor={`date_preset_${option.value}`}
                  className="cursor-pointer text-sm font-normal text-gray-800"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type TagsFilterPopoverProps = {
  tags: string[];
  selectedTags: string[];
  matchMode: TopicMatchMode;
  onChange: (next: { selectedTags: string[]; matchMode: TopicMatchMode }) => void;
};

export function TagsFilterPopover({
  tags,
  selectedTags,
  matchMode,
  onChange,
}: TagsFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags]);
  const isActive = selectedTags.length > 0;

  const filteredTags = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tags;
    return tags.filter((x) => x.toLowerCase().includes(t));
  }, [q, tags]);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedSet);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange({ selectedTags: [...next], matchMode });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={activityFilterTriggerClassName(isActive)}
        >
          <span>Tags</span>
          {isActive && (
            <span className={activityFilterCountBadgeClassName}>
              {selectedTags.length}
            </span>
          )}
          <ChevronDown className={activityFilterChevronDownClassName} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={activityFilterPopoverContentClassName}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-2 py-2">
          <div className="text-sm font-medium text-gray-800">Tags</div>
          <Button
            variant="ghost"
            className="h-7 px-2 text-xs font-normal text-gray-600 hover:text-black"
            onClick={() => onChange({ selectedTags: [], matchMode })}
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-100 px-2 py-2">
          <div className="text-xs font-medium text-gray-500">Match</div>
          <RadioGroup
            value={matchMode}
            onValueChange={(v) =>
              onChange({
                selectedTags,
                matchMode: v as TopicMatchMode,
              })
            }
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="atleast" id="tags_match_atleast" />
              <label htmlFor="tags_match_atleast" className="text-xs text-gray-600">
                At least
              </label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="any" id="tags_match_any" />
              <label htmlFor="tags_match_any" className="text-xs text-gray-600">
                Any
              </label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="all" id="tags_match_all" />
              <label htmlFor="tags_match_all" className="text-xs text-gray-600">
                All
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="relative border-b border-gray-100 px-2 py-2">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-8 pl-9 pr-8 text-sm"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className={cn(activityFilterPopoverScrollClassName, "px-2")}>
          {filteredTags.map((tag) => {
            const checked = selectedSet.has(tag);
            return (
              <label key={tag} className="flex items-center gap-2 py-2 cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={() => toggleTag(tag)} />
                <span className="text-sm text-gray-800">{tag}</span>
              </label>
            );
          })}
          {filteredTags.length === 0 && (
            <div className="text-sm text-gray-400 py-4 text-center">
              No tags
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

